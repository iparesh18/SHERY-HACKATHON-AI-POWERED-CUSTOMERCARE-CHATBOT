import { Ticket } from "../models/ticket.model.js";
import { ChatThread } from "../models/chatThread.model.js";
import { ok, created, fail } from "../utils/response.js";
import { getSuggestedReplies } from "../services/ai.service.js";
import { emitToUser, emitToRole } from "../sockets/index.js";

const listTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { orgId: req.user.orgId };

    if (status) {
      filter.status = status;
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    return ok(res, "Tickets fetched", { tickets });
  } catch (error) {
    return next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    return ok(res, "Ticket fetched", { ticket });
  } catch (error) {
    return next(error);
  }
};

const takeTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, assignedTo: null, status: "open", orgId: req.user.orgId },
      { assignedTo: req.user.id, status: "in-progress" },
      { new: true }
    );

    if (!ticket) {
      return fail(res, 409, "Already taken");
    }

    const payload = { ticket: ticket.toObject() };
    emitToUser(ticket.userId?.toString(), "ticket:assigned", payload);
    emitToUser(req.user.id, "ticket:assigned", payload);
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:assigned", payload);

    return ok(res, "Ticket assigned", { ticket });
  } catch (error) {
    return next(error);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return fail(res, 400, "agentId is required");
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { assignedTo: agentId, status: "in-progress" },
      { new: true }
    );

    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    const payload = { ticket: ticket.toObject() };
    emitToUser(ticket.userId?.toString(), "ticket:assigned", payload);
    emitToUser(agentId, "ticket:assigned", payload);
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:assigned", payload);

    return ok(res, "Ticket assigned", { ticket });
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return fail(res, 400, "status is required");
    }

    const ticket = await Ticket.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    if (req.user.role === "agent" && ticket.assignedTo?.toString() !== req.user.id) {
      return fail(res, 403, "Only the assigned agent can update status");
    }

    ticket.status = status;
    await ticket.save();

    const payload = { ticket: ticket.toObject() };
    emitToUser(ticket.userId?.toString(), "ticket:status", payload);

    if (ticket.assignedTo) {
      emitToUser(ticket.assignedTo.toString(), "ticket:status", payload);
    }
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:status", payload);

    return ok(res, "Status updated", { ticket });
  } catch (error) {
    return next(error);
  }
};

const replyToTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return fail(res, 400, "message is required");
    }

    const ticket = await Ticket.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    if (req.user.role === "agent" && ticket.assignedTo?.toString() !== req.user.id) {
      return fail(res, 403, "Only the assigned agent can reply");
    }

    ticket.messages.push({ sender: "agent", text: message });
    await ticket.save();

    await ChatThread.findOneAndUpdate(
      { userId: ticket.userId, orgId: ticket.orgId },
      { $push: { messages: { sender: "agent", text: message } } },
      { new: true, upsert: true }
    );

    emitToUser(ticket.userId?.toString(), "ticket:message", { ticket: ticket.toObject(), sender: "agent", text: message });

    // Also emit as chat:message so customer sees it in Chat page instantly
    emitToUser(ticket.userId?.toString(), "chat:message", {
      sender: "agent",
      text: message,
      userId: ticket.userId?.toString()
    });

    if (ticket.assignedTo) {
      emitToUser(ticket.assignedTo.toString(), "ticket:message", { ticket: ticket.toObject(), sender: "agent", text: message });
    }
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:message", { ticket: ticket.toObject(), sender: "agent", text: message });

    return created(res, "Reply sent", { ticket });
  } catch (error) {
    return next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    if (ticket.status !== "resolved") {
      return fail(res, 409, "Only resolved tickets can be deleted");
    }

    await ticket.deleteOne();

    emitToUser(ticket.userId?.toString(), "ticket:deleted", { ticketId: ticket._id });
    if (ticket.assignedTo) {
      emitToUser(ticket.assignedTo.toString(), "ticket:deleted", { ticketId: ticket._id });
    }
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:deleted", { ticketId: ticket._id });
    emitToRole(ticket.orgId?.toString(), "agent", "ticket:deleted", { ticketId: ticket._id });

    return ok(res, "Ticket deleted", { ticketId: ticket._id });
  } catch (error) {
    return next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const total = await Ticket.countDocuments({ orgId });
    const byStatusAgg = await Ticket.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const byStatus = { open: 0, "in-progress": 0, resolved: 0 };
    byStatusAgg.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const dailyAgg = await Ticket.aggregate([
      { $match: { orgId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyMap = new Map(dailyAgg.map((item) => [item._id, item.count]));
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: dailyMap.get(key) || 0 };
    });

    // CSAT Analytics
    const ratedTicketsAgg = await Ticket.aggregate([
      { $match: { orgId, customerRating: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$customerRating" },
          totalRated: { $sum: 1 }
        }
      }
    ]);

    const ratingDistributionAgg = await Ticket.aggregate([
      { $match: { orgId, customerRating: { $ne: null } } },
      {
        $group: {
          _id: "$customerRating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistributionAgg.forEach((item) => {
      ratingDistribution[item._id] = item.count;
    });

    const csat = {
      avgRating: ratedTicketsAgg.length > 0 ? ratedTicketsAgg[0].avgRating.toFixed(2) : 0,
      totalRated: ratedTicketsAgg.length > 0 ? ratedTicketsAgg[0].totalRated : 0,
      ratingDistribution
    };

    return ok(res, "Analytics", { total, byStatus, daily, csat });
  } catch (error) {
    return next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!ticket) {
      return fail(res, 404, "Ticket not found");
    }

    if (req.user.role === "agent" && ticket.assignedTo && ticket.assignedTo.toString() !== req.user.id) {
      return fail(res, 403, "Forbidden");
    }

    const suggestions = await getSuggestedReplies({
      issue: ticket.issue,
      messages: ticket.messages || []
    });

    return ok(res, "Suggestions", { suggestions });
  } catch (error) {
    return next(error);
  }
};

const submitRating = async (req, res, next) => {
  try {
    const { rating, ratingText } = req.body;
    const ticketId = req.params.id;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 400, "Rating must be between 1-5");
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, userId },
      {
        customerRating: rating,
        ratingText: ratingText?.trim() || null,
        ratedAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return fail(res, 404, "Ticket not found or unauthorized");
    }

    // Emit to agent and admin
    if (ticket.assignedTo) {
      emitToUser(ticket.assignedTo.toString(), "ticket:rated", { ticket: ticket.toObject(), rating, ratingText: ratingText?.trim() || null });
    }
    emitToRole(ticket.orgId?.toString(), "admin", "ticket:rated", { ticket: ticket.toObject(), rating, ratingText: ratingText?.trim() || null, userId });

    return ok(res, "Rating submitted", { ticket });
  } catch (error) {
    return next(error);
  }
};

export {
  listTickets,
  getTicket,
  takeTicket,
  assignTicket,
  updateStatus,
  replyToTicket,
  deleteTicket,
  getAnalytics,
  getSuggestions,
  submitRating
};
