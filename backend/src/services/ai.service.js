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

const getSuggestedReplies = async ({ issue, messages }) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return DEFAULT_SUGGESTIONS;
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

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
