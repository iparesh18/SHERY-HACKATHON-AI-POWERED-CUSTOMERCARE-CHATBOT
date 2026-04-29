import { api } from "./api.js";

const getTickets = (status) => api.get("/tickets", { params: status ? { status } : {} });
const getTicket = (id) => api.get(`/tickets/${id}`);
const takeTicket = (id) => api.patch(`/tickets/${id}/take`);
const assignTicket = (id, agentId) => api.patch(`/tickets/${id}/assign`, { agentId });
const updateStatus = (id, status) => api.patch(`/tickets/${id}/status`, { status });
const replyTicket = (id, message) => api.post(`/tickets/${id}/reply`, { message });
const deleteTicket = (id) => api.delete(`/tickets/${id}`);
const getTicketAnalytics = () => api.get("/tickets/analytics");
const getTicketSuggestions = (id) => api.get(`/tickets/${id}/suggestions`);

export {
	getTickets,
	getTicket,
	takeTicket,
	assignTicket,
	updateStatus,
	replyTicket,
	deleteTicket,
	getTicketAnalytics,
	getTicketSuggestions
};
