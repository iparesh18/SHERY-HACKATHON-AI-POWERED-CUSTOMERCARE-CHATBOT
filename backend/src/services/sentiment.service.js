import Groq from "groq-sdk";

const analyzeSentimentWithGroq = async (text) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log("GROQ_API_KEY not set, defaulting to neutral sentiment");
      return "neutral";
    }

    if (!text || text.trim().length === 0) {
      return "neutral";
    }

    console.log("Analyzing sentiment with GROQ for text:", text.substring(0, 50) + "...");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis assistant. Analyze the user's message and respond with ONLY one word: 'happy', 'neutral', or 'frustrated'.

happy = positive, satisfied, grateful, thankful, or expressing good emotion
frustrated = angry, upset, annoyed, complaining, or expressing negative emotion
neutral = neither positive nor negative, factual, or unclear sentiment

Respond with ONLY the sentiment word, nothing else.`
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 10
    });

    const sentiment = response?.choices?.[0]?.message?.content?.trim().toLowerCase();
    console.log("GROQ sentiment analysis result:", sentiment);

    if (["happy", "neutral", "frustrated"].includes(sentiment)) {
      return sentiment;
    }

    console.log("Invalid sentiment returned, defaulting to neutral");
    return "neutral";
  } catch (error) {
    console.error("Error analyzing sentiment with GROQ:", error.message);
    return "neutral";
  }
};

export { analyzeSentimentWithGroq };
