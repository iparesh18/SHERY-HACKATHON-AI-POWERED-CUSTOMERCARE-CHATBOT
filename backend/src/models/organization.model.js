import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

export { Organization };
