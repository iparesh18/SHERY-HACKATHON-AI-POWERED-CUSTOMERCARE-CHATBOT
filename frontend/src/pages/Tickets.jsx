import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Select from "../components/Select.jsx";
import TicketCard from "../components/TicketCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../hooks/useToast.js";
import { assignTicket, deleteTicket, getTickets, takeTicket } from "../services/ticket.service.js";
import { getAgents } from "../services/user.service.js";

const Tickets = () => {
  const { user, token } = useAuth();
  const { pushToast } = useToast();
  const { socket } = useSocket(token);
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [agentOptions, setAgentOptions] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await getTickets(statusFilter);
      setTickets(response.data?.data?.tickets || []);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (!agentQuery.trim()) {
      setAgentOptions([]);
      setSelectedAgentId("");
      return undefined;
    }

    const handle = setTimeout(async () => {
      try {
        const response = await getAgents(agentQuery.trim());
        setAgentOptions(response.data?.data?.agents || []);
      } catch (error) {
        pushToast(error?.response?.data?.message || "Failed to load agents", "error");
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [agentQuery]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => fetchTickets();
    socket.on("ticket:created", refresh);
    socket.on("ticket:assigned", refresh);
    socket.on("ticket:status", refresh);

    return () => {
      socket.off("ticket:created", refresh);
      socket.off("ticket:assigned", refresh);
      socket.off("ticket:status", refresh);
    };
  }, [socket, statusFilter]);

  const handleTake = async (id) => {
    try {
      await takeTicket(id);
      pushToast("Ticket assigned", "success");
      fetchTickets();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Unable to take ticket", "error");
    }
  };

  const handleAssign = async (id) => {
    const query = agentQuery.trim();
    const isId = /^[a-fA-F0-9]{24}$/.test(query);
    const matchedAgent = agentOptions.find(
      (agent) =>
        agent._id === selectedAgentId ||
        agent.email.toLowerCase() === query.toLowerCase() ||
        agent.name.toLowerCase() === query.toLowerCase()
    );
    const agentId = isId ? query : matchedAgent?._id;

    if (!agentId) {
      pushToast("Search and select an agent", "warning");
      return;
    }

    try {
      await assignTicket(id, agentId.trim());
      pushToast("Ticket assigned", "success");
      setAgentQuery("");
      setSelectedAgentId("");
      setAgentOptions([]);
      fetchTickets();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Unable to assign ticket", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTicket(id);
      pushToast("Ticket deleted", "success");
      fetchTickets();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Ticket board</h3>
            <p className="text-sm text-muted">Open, in-progress, and resolved requests.</p>
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "open", label: "Open" },
              { value: "in-progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" }
            ]}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets yet" subtitle="New requests will appear here." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket}>
              <Link to={`/app/tickets/${ticket._id}`}>
                <Button variant="ghost">View</Button>
              </Link>
              {user.role === "agent" && !ticket.assignedTo && ticket.status === "open" && (
                <Button onClick={() => handleTake(ticket._id)}>Take Ticket</Button>
              )}
              {user.role === "admin" && (
                <div className="flex flex-wrap gap-2">
                  <div className="min-w-[220px] flex-1">
                    <label className="block text-xs text-white/70">Assign by name or email</label>
                    <input
                      placeholder="Start typing agent name or email"
                      value={agentQuery}
                      onChange={(event) => setAgentQuery(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ember/60"
                    />
                    {agentOptions.length > 0 && (
                      <select
                        value={selectedAgentId}
                        onChange={(event) => setSelectedAgentId(event.target.value)}
                        className="mt-2 select-field"
                      >
                        <option value="">Select agent</option>
                        {agentOptions.map((agent) => (
                          <option key={agent._id} value={agent._id} className="select-option">
                            {agent.name} · {agent.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => handleAssign(ticket._id)}>
                    {ticket.assignedTo ? "Re-assign" : "Assign"}
                  </Button>
                  {ticket.status === "resolved" && (
                    <Button variant="danger" onClick={() => handleDelete(ticket._id)}>
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </TicketCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tickets;
