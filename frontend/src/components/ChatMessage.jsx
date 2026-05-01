import "./ChatMessage.css";

const toneMap = {
  user: "bg-white text-ink",
  ai: "bg-ember/20 text-white border border-ember/40",
  agent: "bg-lagoon/20 text-white border border-lagoon/40",
  system: "bg-white/10 text-white"
};

const alignMap = {
  user: "justify-end",
  ai: "justify-start",
  agent: "justify-start",
  system: "justify-center"
};

const ChatMessage = ({ message, ticketMeta, onRate }) => {
  const sender = message.sender || "system";
  const isAgentMessage = sender === "agent";
  const isResolved = ticketMeta?.status === "resolved";
  const isNotRated = !ticketMeta?.customerRating;
  const showRateButton = isAgentMessage && isResolved && isNotRated;

  return (
    <div className={`flex ${alignMap[sender] || alignMap.system} animate-message-arrive`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${toneMap[sender] || toneMap.system}`}>
        {message.text}
        {showRateButton && (
          <div className="mt-3 pt-2 border-t border-white/30 text-xs flex justify-end">
            <button
              onClick={() => onRate?.()}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white hover:bg-white/20 transition font-semibold"
              title="Rate your experience"
            >
              {`\u2B50 Rate This`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

