import { api } from "./api.js";

const login = (payload) => api.post("/auth/login", payload);
const register = (payload) => api.post("/auth/register", payload);
const logout = () => api.post("/auth/logout");

export { login, register, logout };
