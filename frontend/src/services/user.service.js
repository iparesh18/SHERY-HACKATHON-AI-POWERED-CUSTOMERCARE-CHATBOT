import { api } from "./api.js";

const getAgents = (query) => api.get("/users/agents", { params: query ? { query } : {} });

export { getAgents };
