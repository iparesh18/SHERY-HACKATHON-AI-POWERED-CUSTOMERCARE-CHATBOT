import mongoose from "mongoose";

const orgMembershipSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      required: true
    }
  },
  { timestamps: true }
);

orgMembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });

const OrgMembership = mongoose.model("OrgMembership", orgMembershipSchema);

export { OrgMembership };
