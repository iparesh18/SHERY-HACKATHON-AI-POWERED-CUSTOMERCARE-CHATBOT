import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const SYSTEM_PROMPT = "You are a helpful customer support assistant.\n" +
  "Respond to greetings and basic questions.\n" +
  "If query is about payments, orders, login, or technical issue, respond ONLY with:\n" +
  "ESCALATE_TO_AGENT";

const FALLBACK_MESSAGE = "Hi! How can I help you today?";
const DEFAULT_SUGGESTIONS = [
  "Thanks for reaching out! Can you share a bit more detail so I can help?",
  "Got it. Could you confirm your account email and any recent steps you took?",
  "I can help with that. Let me check and I will get back shortly."
];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const getAIReply = async (message) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return FALLBACK_MESSAGE;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.response?.text?.();

    return text?.trim() || FALLBACK_MESSAGE;
  } catch (error) {
    console.error("Gemini error:", error?.message || error);
    return FALLBACK_MESSAGE;
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

const getSuggestedReplies = async ({ issue, messages }) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return DEFAULT_SUGGESTIONS;
    }

    let prompt = `${SUGGESTION_PROMPT}\n\nIssue: ${issue}`;
    if (messages?.length) {
      const history = messages
        .slice(-6)
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n");
      prompt += `\n\nConversation:\n${history}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const responseText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.response?.text?.();
    const suggestions = parseSuggestions(responseText);

    return suggestions.length ? suggestions : DEFAULT_SUGGESTIONS;
  } catch (error) {
    return DEFAULT_SUGGESTIONS;
  }
};

export { getSuggestedReplies };
