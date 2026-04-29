import { ChatThread } from "../models/chatThread.model.js";
import { Ticket } from "../models/ticket.model.js";
import { ok, created, fail } from "../utils/response.js";
import { getAIReply, FALLBACK_MESSAGE } from "../services/ai.service.js";
import { shouldEscalate } from "../utils/decisionEngine.js";
import { emitToUser, emitToRole } from "../sockets/index.js";

const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const orgId = req.user.orgId;

    if (!message || !message.trim()) {
      return fail(res, 400, "Message is required");
    }

    const chat = await ChatThread.findOneAndUpdate(
      { userId, orgId },
      { $setOnInsert: { userId, orgId } },
      { new: true, upsert: true }
    );

    chat.messages.push({ sender: "user", text: message });
    emitToUser(userId, "chat:message", {
      sender: "user",
      text: message,
      userId
    });

    const aiReply = await getAIReply(message);
    chat.messages.push({ sender: "ai", text: aiReply });
    await chat.save();
    emitToUser(userId, "chat:message", {
      sender: "ai",
      text: aiReply,
      userId
    });

    if (shouldEscalate(message, aiReply)) {
      const ticket = await Ticket.create({
        orgId,
        userId,
        issue: message,
        status: "open",
        assignedTo: null,
        messages: [{ sender: "user", text: message }]
      });

      emitToRole(orgId, "agent", "ticket:created", { ticketId: ticket._id, userId });
      emitToRole(orgId, "admin", "ticket:created", { ticketId: ticket._id, userId });
      emitToUser(userId, "ticket:created", { ticketId: ticket._id, status: ticket.status });

      return created(res, "Ticket created", {
        ticketId: ticket._id,
        response: "Your request has been routed to a support agent."
      });
    }

    const responseText = aiReply || FALLBACK_MESSAGE;
    return ok(res, "AI response", { response: responseText });
  } catch (error) {
    return next(error);
  }
};

const getThread = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role === "customer" && req.user.id !== userId) {
      return fail(res, 403, "Forbidden");
    }

    const chat = await ChatThread.findOne({ userId, orgId: req.user.orgId });
    return ok(res, "Chat thread", { thread: chat });
  } catch (error) {
    return next(error);
  }
};

export { sendMessage, getThread };
