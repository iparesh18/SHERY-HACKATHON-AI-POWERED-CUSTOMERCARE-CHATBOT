import { ChatThread } from "../models/chatThread.model.js";
import { Ticket } from "../models/ticket.model.js";
import { ok, created, fail } from "../utils/response.js";
import { getAIReply, FALLBACK_MESSAGE } from "../services/ai.service.js";
import { createMemory, queryMemory } from "../services/memory.service.js";
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
    
    // Use friendly message for escalation or actual AI reply
    const displayReply = shouldEscalateNow && aiReply?.trim() === "ESCALATE_TO_AGENT" 
      ? "I'm connecting you with a support specialist who can better assist you."
      : aiReply;

    // Only save non-escalation AI responses to chat history and memory
    if (!shouldEscalateNow || aiReply?.trim() !== "ESCALATE_TO_AGENT") {
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
    }

    if (shouldEscalateNow) {
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

      return res.status(201).json({ 
        success: true, 
        reply: "I'm connecting you with a support specialist who can better assist you.",
        ticketId: ticket._id,
        status: ticket.status
      });
    }

    console.log("FINAL AI REPLY:", displayReply);
    return res.status(200).json({ success: true, reply: displayReply });
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
