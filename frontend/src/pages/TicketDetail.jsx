import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../hooks/useToast.js";
import { getTicket, getTicketSuggestions, replyTicket, updateStatus } from "../services/ticket.service.js";
import { formatRelative } from "../utils/format.js";

const TicketDetail = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { pushToast } = useToast();
  const { socket } = useSocket(token);
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchTicket = async () => {
    try {
      const response = await getTicket(id);
      const ticketData = response.data?.data?.ticket;
      setTicket(ticketData);
      setStatus(ticketData?.status || "");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load ticket", "error");
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await getTicketSuggestions(id);
      setSuggestions(response.data?.data?.suggestions || []);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load suggestions", "error");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchSuggestions();
  }, [id]);

  useEffect(() => {
    if (!socket) return undefined;

    const onTicketMessage = (payload = {}) => {
      if (!payload || payload.ticketId !== id) return;
      if (payload.text) {
        setTicket((prev) => {
          if (!prev) return prev;
          return { ...prev, messages: [...(prev.messages || []), { sender: payload.sender || "agent", text: payload.text }] };
        });
      } else {
        // fallback to full refresh when payload doesn't include message text
        fetchTicket();
      }
    };

    const onTicketStatus = (payload = {}) => {
      if (!payload || payload.ticketId !== id) return;
      setStatus(payload.status || "");
      setTicket((prev) => (prev ? { ...prev, status: payload.status || prev.status } : prev));
    };

    socket.on("ticket:message", onTicketMessage);
    socket.on("ticket:status", onTicketStatus);

    return () => {
      socket.off("ticket:message", onTicketMessage);
      socket.off("ticket:status", onTicketStatus);
    };
  }, [socket, id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await replyTicket(id, reply.trim());
      setReply("");
      fetchTicket();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Reply failed", "error");
    }
  };

  const handleStatus = async () => {
    if (!status) return;
    try {
      await updateStatus(id, status);
      pushToast("Status updated", "success");
      fetchTicket();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Status update failed", "error");
    }
  };

  if (!ticket) {
    return <p className="text-sm text-muted">Loading ticket...</p>;
  }

  const agentLocked =
    user?.role === "agent" && ticket.assignedTo && ticket.assignedTo.toString() !== user.id;

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{ticket.issue}</h3>
          <p className="text-sm text-muted">Opened {formatRelative(ticket.createdAt)}</p>
        </div>
        <Badge label={ticket.status} tone={ticket.status} />
      </div>

      <div className="mt-6 h-[360px] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="space-y-3">
          {ticket.messages?.map((message, index) => (
            <ChatMessage key={`${message.text}-${index}`} message={message} />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Suggested replies</p>
            <p className="text-xs text-muted">AI-powered quick responses</p>
          </div>
          <Button variant="ghost" onClick={fetchSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        {suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No suggestions yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={`${suggestion}-${index}`}
                variant="outline"
                onClick={() => setReply(suggestion)}
                className="text-left"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      {agentLocked && (
        <p className="text-sm text-ember">
          This ticket is assigned to another agent. You can view it but cannot reply or update status.
        </p>
      )}

      <div className="mt-5 flex flex-col lg:grid gap-4 lg:grid-cols-[1fr_auto]">
        <Input
          placeholder="Send a reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          disabled={agentLocked}
        />
        <Button className="w-full lg:w-auto" onClick={handleReply} disabled={agentLocked}>Reply</Button>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="select-field w-full sm:w-auto"
          disabled={agentLocked}
        >
          <option value="open" className="select-option">Open</option>
          <option value="in-progress" className="select-option">In Progress</option>
          <option value="resolved" className="select-option">Resolved</option>
        </select>
        <Button className="w-full sm:w-auto" variant="outline" onClick={handleStatus} disabled={agentLocked}>
          Update status
        </Button>
      </div>
    </div>
  );
};

export default TicketDetail;
