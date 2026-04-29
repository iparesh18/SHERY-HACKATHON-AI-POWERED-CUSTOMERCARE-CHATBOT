import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "agent"],
      required: true
    },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    messages: [ticketMessageSchema]
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export { Ticket };
