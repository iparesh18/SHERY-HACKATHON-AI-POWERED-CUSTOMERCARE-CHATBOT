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

const renderFormattedText = (text = "") => {
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="ml-4 list-disc space-y-1">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      blocks.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    const listMatch = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`para-${index}`} className="whitespace-pre-wrap">
        {trimmed}
      </p>
    );
  });

  flushList();

  return blocks.length ? blocks : [<p key="fallback">{text}</p>];
};

const ChatMessage = ({ message, ticketMeta, onRate }) => {
  const sender = message.sender || "system";
  const isAgentMessage = sender === "agent";
  const isResolved = ticketMeta?.status === "resolved";
  const isRated = Boolean(ticketMeta?.customerRating);
  const showRateButton = isAgentMessage && isResolved;

  return (
    <div className={`flex ${alignMap[sender] || alignMap.system} animate-message-arrive`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${toneMap[sender] || toneMap.system}`}>
        <div className="space-y-2">{renderFormattedText(message.text)}</div>
        {showRateButton && (
          <div className="mt-3 pt-2 border-t border-white/30 text-xs flex justify-end">
            {isRated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-white font-semibold">
                {`\u2B50 Rated`}
              </span>
            ) : (
              <button
                onClick={() => onRate?.()}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white hover:bg-white/20 transition font-semibold"
                title="Rate your experience"
              >
                {`\u2B50 Rate This`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

