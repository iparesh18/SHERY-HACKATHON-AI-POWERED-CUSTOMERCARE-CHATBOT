import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
    activeOrgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: false },
    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      default: "customer"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };
