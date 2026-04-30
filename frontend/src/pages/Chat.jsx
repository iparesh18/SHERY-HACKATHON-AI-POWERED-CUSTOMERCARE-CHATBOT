import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../hooks/useToast.js";
import { getChat, sendMessage } from "../services/chat.service.js";

const Chat = () => {
  const { user, token } = useAuth();
  const { pushToast } = useToast();
  const { socket } = useSocket(token);
  const [messages, setMessages] = useState([]);
  const [ticketMeta, setTicketMeta] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const loadThread = async () => {
    setLoading(true);
    try {
      const response = await getChat(user.id);
      const thread = response.data?.data?.thread;
      setMessages(thread?.messages || []);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load chat", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadThread();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return undefined;

    const mergeTicketMeta = (payload = {}) => {
      if (!payload?.ticketId) return;

      setTicketMeta((prev) => ({
        ...(prev || {}),
        ticketId: payload.ticketId,
        status: payload.status || prev?.status || "open"
      }));
    };

    socket.on("ticket:created", mergeTicketMeta);
    socket.on("ticket:status", mergeTicketMeta);

    return () => {
      socket.off("ticket:created", mergeTicketMeta);
      socket.off("ticket:status", mergeTicketMeta);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!canSend) return;

    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setSending(true);

    try {
      const response = await sendMessage(text);
      const payload = response.data || {};
      // ticket created (201) or backend explicitly returned ticketId
      if (response.status === 201 || payload?.ticketId) {
        setTicketMeta({
          ticketId: payload.ticketId || ticketMeta?.ticketId || null,
          status: payload.status || "open"
        });
        setMessages((prev) => [
          ...prev,
          { sender: "system", text: "Your issue has been escalated to support." }
        ]);
      }
      // main AI reply now comes in `reply`
      if (payload?.reply) {
        setMessages((prev) => [...prev, { sender: "ai", text: payload.reply }]);
      }
    } catch (error) {
      pushToast(error?.response?.data?.message || "Message failed", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Customer Chat</h3>
          <p className="text-sm text-muted">AI assistant + escalation to humans</p>
        </div>
      </div>

      {ticketMeta?.ticketId && (
        <div className="mt-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-white">
          Ticket {ticketMeta.ticketId} is {ticketMeta.status || "open"}. Chat history is preserved.
        </div>
      )}

      <div className="mt-6 h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <p className="text-sm text-muted">Loading thread...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">Start the conversation.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <ChatMessage key={`${message.text}-${index}`} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Input
            placeholder="Ask the AI assistant..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <Button onClick={handleSend} disabled={!canSend}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default Chat;
