import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const SYSTEM_PROMPT = "You are a helpful and professional AI customer support assistant.\n" +
  "Your job is to answer general questions, respond to greetings, explain services or company information, and be helpful and friendly.\n" +
  "Escalate ONLY if the user mentions payment or refund issues, order-related problems, login or account issues, technical errors or bugs, or is angry or frustrated.\n" +
  "If you can answer, always answer. Do not escalate unnecessarily.\n" +
  "If unsure, give a general helpful answer and do not escalate.\n" +
  "If escalation is required, respond ONLY with: ESCALATE_TO_AGENT";

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
