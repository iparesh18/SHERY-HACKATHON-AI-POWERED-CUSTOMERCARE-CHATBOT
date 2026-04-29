import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { authRoutes } from "./routes/auth.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { ticketRoutes } from "./routes/ticket.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { orgRoutes } from "./routes/org.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

app.use(morgan("dev"));
const allowedOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", data: null });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orgs", orgRoutes);

app.use(errorHandler);

export { app };
