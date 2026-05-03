import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import SkeletonMessage from "../components/SkeletonMessage.jsx";
import Input from "../components/Input.jsx";
import { RatingModal } from "../components/RatingModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { useToast } from "../hooks/useToast.js";
import { getChat, sendMessage } from "../services/chat.service.js";

const quickQuestions = [
  "How do I reset my password?",
  "Why is my order delayed?",
  "How can I track my request?",
  "I want to speak to an agent",
  "How do I update my account details?",
  "What is the refund process?"
];

const Chat = () => {
  const { user, token } = useAuth();
  const { pushToast } = useToast();
  const { socket } = useSocket(token);
  const [messages, setMessages] = useState([]);
  const [ticketMeta, setTicketMeta] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const bottomRef = useRef(null);
  const ticketMetaRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  // Search functionality - WhatsApp style
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return messages
      .map((msg, idx) => ({
        index: idx,
        message: msg,
        matches: msg.text.toLowerCase().includes(query)
      }))
      .filter((item) => item.matches);
  }, [messages, searchQuery]);

  const totalMatches = filteredMessages.length;
  const currentMatch = totalMatches > 0 ? filteredMessages[currentMatchIndex % totalMatches] : null;

  // Highlight matching text within message
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts;
  };

  const handleNextMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
    }
  };

  const handlePrevMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  const [expandedResults, setExpandedResults] = useState({});

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentMatchIndex(0);
    setExpandedResults({});
    // Scroll to bottom after clearing search
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const toggleExpanded = (index) => {
    setExpandedResults((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const loadThread = async () => {
    setLoading(true);
    try {
      const response = await getChat(user.id);
      const thread = response.data?.data?.thread;
      setMessages(thread?.messages || []);
      if (thread?.escalatedTicketId) {
        setTicketMeta({
          ticketId: thread.escalatedTicketId,
          status: thread.escalatedTicketStatus || (thread.escalated ? "open" : undefined),
          customerRating: thread.escalatedTicketRating || null
        });
      }
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
    ticketMetaRef.current = ticketMeta;
  }, [ticketMeta]);

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

    // Listen for rating submissions
    const onTicketRated = (payload = {}) => {
      const currentTicketId = ticketMetaRef.current?.ticketId;

      if (payload?.ticket) {
        if (payload.ticket._id !== currentTicketId) return;
        setTicketMeta((prev) => ({
          ...(prev || {}),
          ticketId: payload.ticket._id,
          status: payload.ticket.status || prev?.status,
          customerRating: payload.ticket.customerRating ?? prev?.customerRating,
          ratingText: payload.ticket.ratingText ?? prev?.ratingText
        }));
        return;
      }

      if (!payload?.ticketId || payload.ticketId !== currentTicketId) return;
      setTicketMeta((prev) => ({
        ...prev,
        customerRating: payload.rating,
        ratingText: payload.ratingText
      }));
    };

    socket.on("chat:message", onChatMessage);
    socket.on("ticket:rated", onTicketRated);

    return () => {
      socket.off("ticket:created", mergeTicketMeta);
      socket.off("ticket:status", mergeTicketMeta);
      socket.off("chat:message", onChatMessage);
      socket.off("ticket:rated", onTicketRated);
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

  const handleQuickQuestion = (question) => {
    setInput(question);
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

      {messages.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentMatchIndex(0);
              setExpandedResults({});
            }}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-ember/60"
          />
          {searchQuery && (
            <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs text-white/60 whitespace-nowrap px-2 py-2 sm:py-0 flex items-center">
                {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : "No matches"}
              </span>
              <Button
                className="px-2 sm:px-3 py-2 text-xs flex-1 sm:flex-none"
                variant="ghost"
                onClick={handlePrevMatch}
                disabled={totalMatches === 0}
              >
                ↑
              </Button>
              <Button
                className="px-2 sm:px-3 py-2 text-xs flex-1 sm:flex-none"
                variant="ghost"
                onClick={handleNextMatch}
                disabled={totalMatches === 0}
              >
                ↓
              </Button>
              <Button
                className="px-2 sm:px-3 py-2 text-xs flex-1 sm:flex-none"
                variant="ghost"
                onClick={clearSearch}
              >
                ✕
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <p className="text-sm text-muted">Loading thread...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">Start the conversation.</p>
        ) : searchQuery && filteredMessages.length === 0 ? (
          <p className="text-sm text-muted">No messages match "{searchQuery}"</p>
        ) : (
          <div className="space-y-3">
            {(searchQuery ? filteredMessages : messages.map((msg, idx) => ({ index: idx, message: msg }))).map((item) => {
              const message = item.message;
              const index = item.index;
              const isCurrentMatch = searchQuery && currentMatch?.index === index;
              
              return (
                <div
                  key={`${message.text}-${index}`}
                  className={`transition-all ${isCurrentMatch ? "rounded-lg bg-ember/20 border border-ember/40 p-3" : ""}`}
                >
                  {searchQuery && isCurrentMatch && (
                    <p className="text-xs text-ember/80 mb-2">Match {currentMatchIndex + 1} of {totalMatches}</p>
                  )}
                  {searchQuery ? (
                    <div className={`text-xs sm:text-sm ${message.sender === "agent" ? "text-blue-300" : "text-white"}`}>
                      {(() => {
                        const isExpanded = expandedResults[index];
                        const messageText = message.text;
                        const displayText = !isExpanded && messageText.length > 150 ? messageText.substring(0, 150) : messageText;
                        const isLong = messageText.length > 150;
                        
                        return (
                          <>
                            <div className={`transition-all ${!isExpanded && isLong ? "line-clamp-3" : ""} ${isExpanded && isLong ? "rounded-lg bg-white/5 p-3 border border-white/10" : ""}`}>
                              {highlightText(displayText, searchQuery).map((part, i) => 
                                part.toLowerCase() === searchQuery.toLowerCase() ? (
                                  <span key={i} className="bg-yellow-400/40 px-1 rounded font-semibold text-yellow-200">
                                    {part}
                                  </span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                              {!isExpanded && isLong && <span>...</span>}
                            </div>
                            {isLong && (
                              <button
                                onClick={() => toggleExpanded(index)}
                                className="text-xs text-ember hover:text-ember/80 mt-2 underline font-medium transition-colors"
                              >
                                {isExpanded ? "▲ Read less" : "▼ Read more"}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <ChatMessage
                      message={message}
                      ticketMeta={ticketMeta}
                      onRate={() => setShowRatingModal(true)}
                    />
                  )}
                </div>
              );
            })}
            {sending && !searchQuery && <SkeletonMessage lines={3} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">Quick Questions</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => handleQuickQuestion(question)}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-ember/40 hover:bg-ember/10 hover:text-white"
            >
              {question}
            </button>
          ))}
        </div>
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

      {showRatingModal && ticketMeta?.ticketId && (
        <RatingModal
          ticketId={ticketMeta.ticketId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={({ rating, ratingText } = {}) => {
            setTicketMeta((prev) => ({
              ...(prev || {}),
              customerRating: rating,
              ratingText
            }));
            pushToast("Rating submitted successfully!", "success");
          }}
        />
      )}
    </div>
  );
};

export default Chat;
