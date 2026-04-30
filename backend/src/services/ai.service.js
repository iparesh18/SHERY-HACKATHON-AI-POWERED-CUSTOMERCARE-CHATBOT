import { GoogleGenAI } from "@google/genai";
import { getGeminiReply } from "./gemini.service.js";
import { getGroqReply } from "./groq.service.js";

const FALLBACK_MESSAGE = "Hi! How can I help you today?";
const DEFAULT_SUGGESTIONS = [
  "Thanks for reaching out! Can you share a bit more detail so I can help?",
  "Got it. Could you confirm your account email and any recent steps you took?",
  "I can help with that. Let me check and I will get back shortly."
];

const getAIReply = async (message) => {
  try {
    if (process.env.USE_GROQ_ONLY === "true") {
      console.log("AI MODE: GROQ ONLY (TEST)");
      const reply = await getGroqReply(message);
      console.log("AI RESPONSE FROM: GROQ");
      return reply;
    }

    console.log("AI MODE: GEMINI PRIMARY");
    const reply = await getGeminiReply(message);
    console.log("AI RESPONSE FROM: GEMINI");
    return reply?.trim() || FALLBACK_MESSAGE;
  } catch (error) {
    console.log("Gemini failed -> switching to Groq");
    const reply = await getGroqReply(message);
    console.log("AI RESPONSE FROM: GROQ (FALLBACK)");
    return reply;
  }
};

export { getAIReply, FALLBACK_MESSAGE };

const SUGGESTION_PROMPT = `You are a support agent assistant.
Provide exactly 3 short, helpful reply suggestions.
Return each suggestion on a new line starting with a dash.
Keep them under 160 characters.`;

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

const getSuggestedReplies = async ({ issue, messages }) => {
  try {
    let prompt = `${SUGGESTION_PROMPT}\n\nIssue: ${issue}`;
    if (messages?.length) {
      const history = messages
        .slice(-6)
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n");
      prompt += `\n\nConversation:\n${history}`;
    }

    // Prefer GROQ when explicitly requested, otherwise try Gemini first if available
    const useGroqOnly = process.env.USE_GROQ_ONLY === "true";

    // Try Gemini if configured and not forcing Groq
    if (!useGroqOnly && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt
        });

        const responseText =
          response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.response?.text?.();
        // If the model returned an escalation token, replace with helpful escalation suggestions
        if (responseText && /ESCALATE_TO_AGENT/.test(responseText)) {
          return buildEscalationSuggestions(issue);
        }
        const suggestions = parseSuggestions(responseText);
        if (suggestions.length) return suggestions;
      } catch (err) {
        // fall through to try GROQ
        console.error("Gemini suggestions failed:", err?.message || err);
      }
    }

    // Try GROQ if configured
    if (process.env.GROQ_API_KEY) {
      try {
        const groqText = await getGroqReply(prompt);
        if (groqText && /ESCALATE_TO_AGENT/.test(groqText)) {
          return buildEscalationSuggestions(issue);
        }
        const suggestions = parseSuggestions(groqText);
        if (suggestions.length) return suggestions;
      } catch (err) {
        console.error("Groq suggestions failed:", err?.message || err);
      }
    }

    return DEFAULT_SUGGESTIONS;
  } catch (error) {
    return DEFAULT_SUGGESTIONS;
  }
};

export { getSuggestedReplies };
