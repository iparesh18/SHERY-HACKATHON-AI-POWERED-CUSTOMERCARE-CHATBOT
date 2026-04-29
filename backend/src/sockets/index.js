import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

let ioInstance = null;

const getTokenFromSocket = (socket) => {
  const header = socket.handshake.headers?.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  return socket.handshake.auth?.token || null;
};

const initSockets = (io) => {
  ioInstance = io;

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
