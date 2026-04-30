import { GoogleGenAI } from "@google/genai";
import { getIndex, queryVectors } from "./pinecone.service.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const createEmbedding = async (text) => {
  try {
    if (!process.env.GEMINI_API_KEY) return null;

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        outputDimensionality: 768
      }
    });

    const values = response?.embeddings?.[0]?.values || null;
    if (values) {
      console.log("Embedding length:", values.length);
    }

    return values;
  } catch (error) {
    console.error("Embedding error:", error?.message || error);
    return null;
  }
};

const saveMessageMemory = async ({ userId, message }) => {
  try {
    if (!message || typeof message !== "string" || !message.trim()) {
      console.log("Skipping: empty message");
      return false;
    }

    const embedding = await createEmbedding(message);
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.log("Skipping: invalid embedding", embedding);
      return false;
    }

    const index = getIndex();
    if (!index) return false;

    const vector = {
      id: `${userId}-${Date.now()}`,
      values: embedding,
      metadata: {
        text: message,
        userId,
        createdAt: Date.now()
      }
    };

    const payload = {
      records: [vector],
      namespace: userId
    };

    console.log("Upserting vector:", vector.id, "length:", embedding.length);
    console.log("Final upsert payload:", payload);

    await index.upsert(payload);

    return true;
  } catch (err) {
    console.log("Pinecone upsert error:", err?.message || err);
    return false;
  }
};

const getRelevantMemory = async ({ userId, message }) => {
  try {
    const vector = await createEmbedding(message);
    if (!vector) return [];

    const matches = await queryVectors({
      vector,
      topK: 5,
      namespace: userId
    });

    return matches
      .map((match) => match?.metadata?.text)
      .filter(Boolean)
      .slice(0, 5);
  } catch (error) {
    console.error("Memory fetch error:", error?.message || error);
    return [];
  }
};

const createMemory = async ({ id, content, namespace }) => {
  try {
    if (!content || typeof content !== "string" || !content.trim()) {
      console.log("Skipping: empty memory content");
      return false;
    }

    const embedding = await createEmbedding(content);
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.log("Skipping: invalid embedding", embedding);
      return false;
    }

    const index = getIndex();
    if (!index) return false;

    const vector = {
      id: id || `${namespace}-${Date.now()}`,
      values: embedding,
      metadata: {
        text: content,
        userId: namespace,
        createdAt: Date.now()
      }
    };

    const payload = {
      records: [vector],
      namespace
    };

    console.log("Upserting memory:", vector.id, "length:", embedding.length);
    console.log("Final upsert payload:", payload);

    await index.upsert(payload);
    return true;
  } catch (err) {
    console.log("Pinecone upsert error:", err?.message || err);
    return false;
  }
};

const queryMemory = async ({ query, limit = 5, namespace }) => {
  try {
    if (!query || typeof query !== "string" || !query.trim()) {
      return [];
    }

    const vector = await createEmbedding(query);
    if (!vector) return [];

    const matches = await queryVectors({
      vector,
      topK: limit,
      namespace
    });

    return Array.isArray(matches) ? matches : [];
  } catch (error) {
    console.error("Memory fetch error:", error?.message || error);
    return [];
  }
};

export {
  createEmbedding,
  saveMessageMemory,
  getRelevantMemory,
  createMemory,
  queryMemory
};
