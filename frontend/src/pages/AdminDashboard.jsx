import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Select from "../components/Select.jsx";
import TicketCard from "../components/TicketCard.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../hooks/useToast.js";
import {
  assignTicket,
  deleteTicket,
  getTicketAnalytics,
  getTickets,
  updateStatus
} from "../services/ticket.service.js";
import { useAuth } from "../hooks/useAuth.js";
import { getAgents } from "../services/user.service.js";

const AdminDashboard = () => {
  const { token } = useAuth();
  const { socket } = useSocket(token);
  const { pushToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [agentOptions, setAgentOptions] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const fetchTickets = async () => {
    try {
      const response = await getTickets(filter);
      setTickets(response.data?.data?.tickets || []);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load tickets", "error");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await getTicketAnalytics();
      setAnalytics(response.data?.data || null);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load analytics", "error");
    }
  };


  useEffect(() => {
    fetchTickets();
    fetchAnalytics();
  }, [filter]);

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

    const refresh = () => {
      fetchTickets();
      fetchAnalytics();
    };
    socket.on("ticket:created", refresh);
    socket.on("ticket:assigned", refresh);
    socket.on("ticket:status", refresh);

    return () => {
      socket.off("ticket:created", refresh);
      socket.off("ticket:assigned", refresh);
      socket.off("ticket:status", refresh);
    };
  }, [socket, filter]);

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
      pushToast(error?.response?.data?.message || "Assign failed", "error");
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateStatus(id, status);
      pushToast("Status updated", "success");
      fetchTickets();
      fetchAnalytics();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Status update failed", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTicket(id);
      pushToast("Ticket deleted", "success");
      fetchTickets();
      fetchAnalytics();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Delete failed", "error");
    }
  };


  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Analytics</h3>
            <p className="text-sm text-muted">Last 7 days overview</p>
          </div>
        </div>
        {analytics ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-muted">Total</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-muted">Open</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.byStatus?.open || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-muted">In Progress</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.byStatus?.["in-progress"] || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-muted">Resolved</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.byStatus?.resolved || 0}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Loading analytics...</p>
        )}

        {analytics?.daily && analytics.daily.length > 0 && (
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="grid min-w-[320px] grid-cols-7 gap-2">
              {analytics.daily.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <div className="h-24 w-full rounded-full bg-white/10">
                  <div
                    className="mx-auto w-2 rounded-full bg-ember"
                    style={{ height: `${Math.max(day.count * 16, 6)}px` }}
                    title={`${day.count} tickets`}
                  />
                </div>
                <span className="text-[10px] text-white/50">{day.date.slice(5)}</span>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Admin control center</h3>
            <p className="text-sm text-muted">Assign tickets and track agent progress.</p>
          </div>
          <Select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "open", label: "Open" },
              { value: "in-progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" }
            ]}
          />
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState title="No tickets" subtitle="Stay tuned for new escalations." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket}>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
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
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full mt-2 sm:mt-0">
                <Button className="w-full sm:w-auto" variant="ghost" onClick={() => handleStatus(ticket._id, "open")}>
                  Open
                </Button>
                <Button className="w-full sm:w-auto" variant="ghost" onClick={() => handleStatus(ticket._id, "in-progress")}>
                  In Progress
                </Button>
                <Button className="w-full sm:w-auto" variant="ghost" onClick={() => handleStatus(ticket._id, "resolved")}>
                  Resolve
                </Button>
                {ticket.status === "resolved" && (
                  <Button className="w-full sm:w-auto" variant="danger" onClick={() => handleDelete(ticket._id)}>
                    Delete
                  </Button>
                )}
              </div>
            </TicketCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
