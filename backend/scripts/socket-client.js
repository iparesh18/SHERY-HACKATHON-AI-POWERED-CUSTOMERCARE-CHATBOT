import { io } from "socket.io-client";
import readline from "readline";

const baseUrl = process.env.SOCKET_URL || "http://localhost:5000";
const token = process.env.SOCKET_TOKEN;

if (!token) {
  console.error("Missing SOCKET_TOKEN env var");
  process.exit(1);
}

const socket = io(baseUrl, {
  auth: { token }
});

socket.on("connect", () => {
  console.log("Connected", socket.id);
});

socket.on("socket:ready", (payload) => {
  console.log("Ready", payload);
});

const events = [
  "chat:message",
  "ticket:created",
  "ticket:assigned",
  "ticket:status",
  "ticket:message"
];

for (const event of events) {
  socket.on(event, (payload) => {
    console.log(`[${event}]`, payload);
  });
}

socket.on("disconnect", () => {
  console.log("Disconnected");
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("SIGINT", () => {
  socket.disconnect();
  rl.close();
});
