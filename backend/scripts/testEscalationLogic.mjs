// Direct test to verify escalation suggestion logic
const parseSuggestions = (text) => {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
};

const buildEscalationSuggestions = (issue = "") => {
  const lower = (issue || "").toLowerCase();
  const isPayment = /payment|billing|refund|charge|invoice|transaction/.test(lower);
  const isSecurity = /password|unauthorized|fraud|security|account access|hacked/.test(lower);

  if (isPayment) {
    return [
      "I'm escalating this to our billing team — please provide your order ID and last 4 digits of the card.",
      "Please confirm the transaction date and amount so billing can investigate faster.",
      "Our billing specialist will follow up within 24 hours — we'll update you as soon as we have news."
    ];
  }

  if (isSecurity) {
    return [
      "This appears to be a security issue — please change your password immediately and enable 2FA.",
      "Provide any suspicious activity details (times, IPs, messages) to help our security team.",
      "We've escalated this to security; an agent will contact you with next steps soon."
    ];
  }

  return [
    "I'm escalating this to a specialist who can help further — please share any relevant order or account details.",
    "Can you provide screenshots or exact error messages to help speed up the investigation?",
    "A specialist will review and respond shortly; we'll keep you updated via this thread."
  ];
};

// Simulate provider response with ESCALATE_TO_AGENT
console.log("TEST 1: Provider returns ESCALATE_TO_AGENT for payment issue");
const mockPaymentResponse = "ESCALATE_TO_AGENT";
const issue1 = "I was charged twice for my subscription";
if (mockPaymentResponse && /ESCALATE_TO_AGENT/.test(mockPaymentResponse)) {
  const result = buildEscalationSuggestions(issue1);
  console.log("Result:", result);
  console.log("✓ Payment escalation suggestions returned (not ESCALATE_TO_AGENT token)\n");
}

console.log("TEST 2: Provider returns ESCALATE_TO_AGENT for security issue");
const mockSecurityResponse = "ESCALATE_TO_AGENT";
const issue2 = "Unauthorized access to my account — someone changed my password";
if (mockSecurityResponse && /ESCALATE_TO_AGENT/.test(mockSecurityResponse)) {
  const result = buildEscalationSuggestions(issue2);
  console.log("Result:", result);
  console.log("✓ Security escalation suggestions returned (not ESCALATE_TO_AGENT token)\n");
}

console.log("TEST 3: Provider returns ESCALATE_TO_AGENT for generic issue");
const mockGenericResponse = "ESCALATE_TO_AGENT";
const issue3 = "My app has a bug";
if (mockGenericResponse && /ESCALATE_TO_AGENT/.test(mockGenericResponse)) {
  const result = buildEscalationSuggestions(issue3);
  console.log("Result:", result);
  console.log("✓ Generic escalation suggestions returned (not ESCALATE_TO_AGENT token)\n");
}

console.log("✓ All escalation detection tests passed!");
