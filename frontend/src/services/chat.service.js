import { api } from "./api.js";

const sendMessage = (message) => api.post("/chat/send", { message });
const getChat = (userId) => api.get(`/chat/${userId}`);

export { sendMessage, getChat };
