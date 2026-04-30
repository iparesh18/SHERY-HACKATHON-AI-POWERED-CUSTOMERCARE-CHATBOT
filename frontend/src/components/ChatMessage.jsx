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

const ChatMessage = ({ message }) => {
  const sender = message.sender || "system";
  return (
    <div className={`flex ${alignMap[sender] || alignMap.system} animate-message-arrive`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${toneMap[sender] || toneMap.system}`}>
        {message.text}
      </div>
    </div>
  );
};

export default ChatMessage;
