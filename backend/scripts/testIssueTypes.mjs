// Test various issue types to show fallback behavior
const buildEscalationSuggestions = (issue = "") => {
  const lower = (issue || "").toLowerCase();
  const isPayment = /payment|billing|refund|charge|invoice|transaction/.test(lower);
  const isSecurity = /password|unauthorized|fraud|security|account access|hacked/.test(lower);

  if (isPayment) {
    return ["payment_specific"];
  }

  if (isSecurity) {
    return ["security_specific"];
  }

  return [
    "I'm escalating this to a specialist who can help further — please share any relevant order or account details.",
    "Can you provide screenshots or exact error messages to help speed up the investigation?",
    "A specialist will review and respond shortly; we'll keep you updated via this thread."
  ];
};

const testIssues = [
  "I was charged twice for my subscription",
  "Someone hacked my account",
  "My app crashes on startup",
  "I lost all my data",
  "Feature is not working",
  "Can't download my files",
  "App is slow",
  "Need refund",
  "Unauthorized login attempts"
];

console.log("Issue Type Detection Results:\n");
testIssues.forEach((issue) => {
  const suggestions = buildEscalationSuggestions(issue);
  const type = suggestions[0] === "payment_specific" ? "PAYMENT" : 
              suggestions[0] === "security_specific" ? "SECURITY" : 
              "GENERIC (fallback)";
  console.log(`"${issue}"`);
  console.log(`→ ${type}`);
  console.log(`→ Suggestions: ${suggestions.slice(0, 1).join(", ")}\n`);
});
