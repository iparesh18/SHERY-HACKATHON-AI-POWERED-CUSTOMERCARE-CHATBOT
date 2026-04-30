const shouldEscalate = (message, aiReply) => {
  const safeReply = (aiReply || "").trim();
  const normalizedReply = safeReply.toLowerCase();
  const normalizedMessage = (message || "").toLowerCase();

  // Check for explicit escalation markers
  if (safeReply === "ESCALATE_TO_AGENT") return true;
  if (safeReply === "I couldn't understand your request") return false;
  if (normalizedReply.includes("escalate_to_agent")) return true;

  // Auto-escalate for serious issues: payment, billing, refunds, account issues
  const criticalKeywords = [
    "payment", "billing", "invoice", "refund", "charge", 
    "credit card", "bank", "subscription", "cancel account",
    "delete account", "security issue", "fraud", "unauthorized",
    "complaint", "legal", "urgent", "emergency"
  ];

  for (const keyword of criticalKeywords) {
    if (normalizedMessage.includes(keyword)) {
      console.log(`Auto-escalating: detected critical keyword "${keyword}"`);
      return true;
    }
  }

  // Long messages might need agent review
  if (message.length > 200) return true;

  return false;
};

export { shouldEscalate };
