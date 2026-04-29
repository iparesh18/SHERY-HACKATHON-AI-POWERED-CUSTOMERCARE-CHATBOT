import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { baseURL } from "../services/api.js";

const socketUrl = baseURL.replace("/api", "");

const useSocket = (token) => {
  const [connected, setConnected] = useState(false);

  const socket = useMemo(() => {
    if (!token) return null;
    return io(socketUrl, {
      auth: { token },
      transports: ["websocket"]
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return { socket, connected };
};

export { useSocket };
