import Groq from "groq-sdk";

const FALLBACK_MESSAGE = "Hi! How can I help you today?";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getGroqReply = async (message) => {
  try {
    console.log("Calling GROQ API");

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful AI customer support assistant. Always respond clearly and naturally.

IMPORTANT ESCALATION RULES:
- If the user asks about payment issues, billing, refunds, or charges → respond with: ESCALATE_TO_AGENT
- If the user mentions account security, unauthorized access, or fraud → respond with: ESCALATE_TO_AGENT
- If the user asks about something confidential, sensitive, or beyond your capabilities → respond with: ESCALATE_TO_AGENT
- If the user needs legal advice or mentions legal matters → respond with: ESCALATE_TO_AGENT
- If you're uncertain or cannot safely handle the request → respond with: ESCALATE_TO_AGENT

Always prioritize user safety and satisfaction. When in doubt, escalate to a human agent by responding with exactly: ESCALATE_TO_AGENT`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
    });

    console.log("GROQ RAW RESPONSE:", JSON.stringify(response, null, 2));

    const reply = response?.choices?.[0]?.message?.content;

    if (!reply) {
      console.log("GROQ returned empty content, using fallback");
      return FALLBACK_MESSAGE;
    }

    console.log("GROQ text extracted successfully, length:", reply.length);
    return reply || FALLBACK_MESSAGE;
  } catch (error) {
    console.log("GROQ ERROR:", error.message);
    throw error;
  }
};

export { getGroqReply, FALLBACK_MESSAGE };
