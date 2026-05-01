import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import SkeletonMessage from "../components/SkeletonMessage.jsx";
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

    // helper to avoid duplicate consecutive messages
    const appendMessageIfNew = (msg) => {
      if (!msg || !msg.text) return;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === msg.sender && last.text === msg.text) return prev;
        return [...prev, msg];
      });
    };

    // Also listen for live chat messages from server
    const onChatMessage = (payload = {}) => {
      if (!payload) return;
      // Only append messages for this user - compare as strings to handle ObjectId vs string
      if (payload.userId && payload.userId !== user.id?.toString()) return;
      appendMessageIfNew({ sender: payload.sender || "ai", text: payload.text });
    };

    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("ticket:created", mergeTicketMeta);
      socket.off("ticket:status", mergeTicketMeta);
      socket.off("chat:message", onChatMessage);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    if (!canSend) return;

    const text = input.trim();
    setInput("");
    // append user message but avoid duplicates
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === "user" && last.text === text) return prev;
      return [...prev, { sender: "user", text }];
    });
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
        // rely on appendMessageIfNew via socket or dedupe here
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.sender === "ai" && last.text === payload.reply) return prev;
          return [...prev, { sender: "ai", text: payload.reply }];
        });
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
            {sending && <SkeletonMessage lines={3} />}
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
