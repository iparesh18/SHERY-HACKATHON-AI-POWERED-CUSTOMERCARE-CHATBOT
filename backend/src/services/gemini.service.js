const SYSTEM_PROMPT = `You are a helpful and professional AI customer support assistant.

IMPORTANT ESCALATION RULES:
- If the user asks about payment issues, billing, refunds, or charges → respond with: ESCALATE_TO_AGENT
- If the user mentions account security, unauthorized access, or fraud → respond with: ESCALATE_TO_AGENT
- If the user asks about something confidential, sensitive, or beyond your capabilities → respond with: ESCALATE_TO_AGENT
- If the user needs legal advice or mentions legal matters → respond with: ESCALATE_TO_AGENT
- If you're uncertain or cannot safely handle the request → respond with: ESCALATE_TO_AGENT

Always prioritize user safety and satisfaction. When in doubt, escalate to a human agent by responding with exactly: ESCALATE_TO_AGENT`;

const getGeminiReply = async (message) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY not set, skipping GEMINI provider");
      throw new Error("GEMINI_API_KEY not configured");
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Calling GEMINI API with model: gemini-2.5-flash");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    console.log("GEMINI response received:", response?.candidates?.length, "candidates");
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log("GEMINI returned empty content");
      throw new Error("Empty response from Gemini");
    }
    console.log("GEMINI text extracted successfully, length:", text.length);
    return text?.trim();
  } catch(error) {
    const messageText = String(error?.message || error).toLowerCase();
    if (messageText.includes("429") || messageText.includes("quota")) {
      throw error;
    }

    throw error;
  }
};

export { getGeminiReply };
