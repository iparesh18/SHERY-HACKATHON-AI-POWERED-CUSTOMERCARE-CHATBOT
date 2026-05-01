import { useEffect, useState, useRef } from "react";
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
import { debounce } from "../utils/debounce.js";

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
  const debouncedRefreshRef = useRef(null);

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

  // Create debounced refresh function (only once)
  useEffect(() => {
    debouncedRefreshRef.current = debounce(() => {
      fetchTickets();
    }, 500);
  }, []);

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
    if (!socket || !debouncedRefreshRef.current) return undefined;

    const handleRefresh = () => debouncedRefreshRef.current();

    // Listen to all ticket events
    socket.on("ticket:created", handleRefresh);
    socket.on("ticket:assigned", handleRefresh);
    socket.on("ticket:status", handleRefresh);
    socket.on("ticket:message", handleRefresh);
    socket.on("ticket:deleted", handleRefresh);

    return () => {
      socket.off("ticket:created", handleRefresh);
      socket.off("ticket:assigned", handleRefresh);
      socket.off("ticket:status", handleRefresh);
      socket.off("ticket:message", handleRefresh);
      socket.off("ticket:deleted", handleRefresh);
    };
  }, [socket]);

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
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
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
              <Link to={`/app/tickets/${ticket._id}`} className="w-full sm:w-auto">
                <Button className="w-full" variant="ghost">View</Button>
              </Link>
              {user.role === "agent" && !ticket.assignedTo && ticket.status === "open" && (
                <Button className="w-full sm:w-auto" onClick={() => handleTake(ticket._id)}>Take Ticket</Button>
              )}
              {user.role === "admin" && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full mt-2 sm:mt-0">
                  <div className="w-full sm:min-w-[220px] flex-1">
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
                  <Button className="w-full sm:w-auto mt-2 sm:mt-0" variant="outline" onClick={() => handleAssign(ticket._id)}>
                    {ticket.assignedTo ? "Re-assign" : "Assign"}
                  </Button>
                  {ticket.status === "resolved" && (
                    <Button className="w-full sm:w-auto" variant="danger" onClick={() => handleDelete(ticket._id)}>
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
