import mongoose from "mongoose";

const orgInviteSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      default: "agent"
    },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const OrgInvite = mongoose.model("OrgInvite", orgInviteSchema);

export { OrgInvite };
