import { api } from "./api.js";

const getOrgs = () => api.get("/orgs");
const switchOrg = (orgId) => api.post("/orgs/switch", { orgId });
const createOrg = (name) => api.post("/orgs/create", { name });
const listInvites = () => api.get("/orgs/invites");
const createInvite = (payload) => api.post("/orgs/invites", payload);
const deleteInvite = (id) => api.delete(`/orgs/invites/${id}`);
const acceptInvite = (code) => api.post("/orgs/invites/accept", { code });

export { getOrgs, switchOrg, createOrg, listInvites, createInvite, deleteInvite, acceptInvite };
