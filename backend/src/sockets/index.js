import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env.js";

let ioInstance = null;
let adapterSetupPromise = null;

const buildRedisUrl = () => {
  if (env.redisUrl) {
    return env.redisUrl;
  }

  const host = env.redisHost || "127.0.0.1";
  const port = Number(env.redisPort || 6379);
  const auth = env.redisPassword ? `:${encodeURIComponent(env.redisPassword)}@` : "";
  const useTls = env.redisTls || host.includes("redislabs.com") || host.includes("redis.cloud");

  return `${useTls ? "rediss" : "redis"}://${auth}${host}:${port}`;
};

const setupRedisAdapter = async (io) => {
  if (!env.redisHost && !env.redisPassword) {
    console.warn("Socket.IO Redis adapter skipped: REDIS_HOST not configured");
    return;
  }

  const redisUrl = buildRedisUrl();
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error("Socket.IO Redis pub client error:", error?.message || error);
  });

  subClient.on("error", (error) => {
    console.error("Socket.IO Redis sub client error:", error?.message || error);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis adapter enabled");
};

const getTokenFromSocket = (socket) => {
  const header = socket.handshake.headers?.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  return socket.handshake.auth?.token || null;
};

const initSockets = async (io) => {
  ioInstance = io;

  if (!adapterSetupPromise) {
    adapterSetupPromise = setupRedisAdapter(io).catch((error) => {
      console.error("Socket.IO Redis adapter failed:", error?.message || error);
    });
  }

  await adapterSetupPromise;

  io.on("connection", (socket) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = jwt.verify(token, env.jwtSecret);
      const userId = payload.sub;
      const role = payload.role;
      const orgId = payload.orgId;

      socket.join(`user:${userId}`);
      if (orgId) {
        socket.join(`org:${orgId}`);
        socket.join(`role:${orgId}:${role}`);
      }
      socket.emit("socket:ready", { userId, role, orgId });
    } catch (error) {
      socket.disconnect(true);
    }
  });
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const emitToRole = (orgId, role, event, payload) => {
  if (!ioInstance || !role || !orgId) return;
  ioInstance.to(`role:${orgId}:${role}`).emit(event, payload);
};

export { initSockets, emitToUser, emitToRole };
