import { ChatThread } from "../models/chatThread.model.js";
import { Ticket } from "../models/ticket.model.js";
import { ok, created, fail } from "../utils/response.js";
import { getAIReply, FALLBACK_MESSAGE } from "../services/ai.service.js";
import { createMemory, queryMemory } from "../services/memory.service.js";
import { getCache, setCache } from "../services/cache.service.js";
import { shouldEscalate } from "../utils/decisionEngine.js";
import { emitToUser, emitToRole } from "../sockets/index.js";
import { analyzeSentimentWithGroq } from "../services/sentiment.service.js";

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

    // append user message immediately
    chat.messages.push({ sender: "user", text: message });
    emitToUser(userId, "chat:message", {
      sender: "user",
      text: message,
      userId
    });

    const cacheKey = `chat:${userId}:${message.trim()}`;
    const cachedReply = await getCache(cacheKey);
    if (cachedReply) {
      const cachedText = typeof cachedReply === "string" ? cachedReply : cachedReply?.reply;

      if (cachedText) {
        console.log("CACHE HIT");
        chat.messages.push({ sender: "ai", text: cachedText });
        await chat.save();

        emitToUser(userId, "chat:message", {
          sender: "ai",
          text: cachedText,
          userId
        });

        return res.status(200).json({ success: true, reply: cachedText });
      }
    }

    let memories = [];
    try {
      memories = await queryMemory({ query: message, limit: 5, namespace: userId });
    } catch (error) {
      console.error("Memory lookup error:", error?.message || error);
    }

    const memoryText = memories.length
      ? memories.map((m, i) => `Memory ${i + 1}: ${m?.metadata?.text}`).join("\n")
      : "No past memory";

    const finalPrompt = `You are a smart AI assistant with memory.

You can remember past conversations.

---

PAST CONVERSATION:
${memoryText}
-------------

CURRENT MESSAGE:
${message}

---

RULES:

* Use past conversation if relevant
* If user asks about previous chat - answer using memory
* DO NOT say "I don't remember"
* If no memory - respond normally

Answer clearly and naturally.`;

    console.log("Memory used:", memoryText);

    let aiReply = await getAIReply(finalPrompt);
    if (!aiReply) aiReply = FALLBACK_MESSAGE;
    console.log("AI RESPONSE:", aiReply);

    // Check if AI wants to escalate
    const shouldEscalateNow = aiReply?.trim() === "ESCALATE_TO_AGENT" || shouldEscalate(message, aiReply);
    const escalationReply = "I'm connecting you with a support specialist who can better assist you.";

    // Only save non-escalation AI responses to chat history and memory
    if (!shouldEscalateNow) {
      const displayReply = aiReply;
      chat.messages.push({ sender: "ai", text: displayReply });
      await chat.save();

      emitToUser(userId, "chat:message", {
        sender: "ai",
        text: displayReply,
        userId
      });

      try {
        await createMemory({
          id: `${userId}-${Date.now()}`,
          content: `User: ${message}\nAI: ${displayReply}`,
          namespace: userId
        });
      } catch (error) {
        console.error("Memory save error:", error?.message || error);
      }

      await setCache(cacheKey, displayReply, 60);
      console.log("FINAL AI REPLY:", displayReply);
      return res.status(200).json({ success: true, reply: displayReply });
    }

    if (shouldEscalateNow) {
      // Analyze sentiment of the user's problem
      const sentiment = await analyzeSentimentWithGroq(message);

      const ticket = await Ticket.create({
        orgId,
        userId,
        issue: message,
        status: "open",
        assignedTo: null,
        messages: [{ sender: "user", text: message }],
        sentiment
      });

      // mark chat as escalated and save the escalation reply
      chat.escalated = true;
      chat.escalatedTicketId = ticket._id;
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (!(lastMessage && lastMessage.sender === "ai" && lastMessage.text === escalationReply)) {
        chat.messages.push({ sender: "ai", text: escalationReply });
      }
      await chat.save();

      // The HTTP response already returns the escalation reply to the requester.
      // Avoid emitting a duplicate `chat:message` to the same user socket to
      // prevent the client from receiving the same AI message twice.

      emitToRole(orgId, "agent", "ticket:created", { ticketId: ticket._id, userId });
      emitToRole(orgId, "admin", "ticket:created", { ticketId: ticket._id, userId });
      emitToUser(userId, "ticket:created", { ticketId: ticket._id, status: ticket.status });

      return res.status(201).json({ 
        success: true, 
        reply: escalationReply,
        ticketId: ticket._id,
        status: ticket.status
      });
    }
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
    let escalatedTicketStatus = null;
    let escalatedTicketRating = null;

    if (chat?.escalatedTicketId) {
      const ticket = await Ticket.findOne({
        _id: chat.escalatedTicketId,
        orgId: req.user.orgId
      }).select("status customerRating");

      if (ticket) {
        escalatedTicketStatus = ticket.status;
        escalatedTicketRating = ticket.customerRating;
      }
    }

    if (chat?.messages?.length) {
      const dedupedMessages = [];
      for (const currentMessage of chat.messages) {
        const previousMessage = dedupedMessages[dedupedMessages.length - 1];
        if (
          previousMessage &&
          previousMessage.sender === currentMessage.sender &&
          previousMessage.text === currentMessage.text
        ) {
          continue;
        }
        dedupedMessages.push(currentMessage);
      }

      if (dedupedMessages.length !== chat.messages.length) {
        chat.messages = dedupedMessages;
        await chat.save();
      }
    }
    const thread = chat?.toObject ? chat.toObject() : chat;
    if (thread) {
      thread.escalatedTicketStatus = escalatedTicketStatus;
      thread.escalatedTicketRating = escalatedTicketRating;
    }

    return ok(res, "Chat thread", { thread });
  } catch (error) {
    return next(error);
  }
};

export { sendMessage, getThread };
