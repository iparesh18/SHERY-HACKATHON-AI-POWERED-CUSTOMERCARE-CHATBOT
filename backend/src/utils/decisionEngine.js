const shouldEscalate = (message, aiReply) => {
  const safeReply = (aiReply || "").trim();
  const normalized = safeReply.toLowerCase();

  if (safeReply === "ESCALATE_TO_AGENT") return true;
  if (safeReply === "I couldn't understand your request") return false;
  if (message.length > 200) return true;
  if (normalized.includes("escalate_to_agent")) return true;

  return false;
};

export { shouldEscalate };
