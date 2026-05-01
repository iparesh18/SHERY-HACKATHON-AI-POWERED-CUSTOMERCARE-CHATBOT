import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai", "agent"],
      required: true
    },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const chatThreadSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema]
  },
  { timestamps: true }
);

// Track escalation state so frontend can persist escalated reply until resolved
chatThreadSchema.add({
  escalated: { type: Boolean, default: false },
  escalatedTicketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", default: null }
});

const ChatThread = mongoose.model("ChatThread", chatThreadSchema);

export { ChatThread };
