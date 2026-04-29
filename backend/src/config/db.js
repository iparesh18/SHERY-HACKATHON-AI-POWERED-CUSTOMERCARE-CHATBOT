import mongoose from "mongoose";
import { env } from "./env.js";

const connectDb = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
};

export { connectDb };
