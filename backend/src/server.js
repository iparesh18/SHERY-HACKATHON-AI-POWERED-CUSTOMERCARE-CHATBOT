import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";

import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { initSockets } from "./sockets/index.js";

const server = http.createServer(app);
const allowedOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

initSockets(io);

const startServer = async () => {
  await connectDb();

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();
