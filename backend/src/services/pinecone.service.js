import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const getIndex = () => {
  if (!process.env.PINECONE_API_KEY) {
    return null;
  }

  if (!process.env.PINECONE_HOST && !process.env.PINECONE_INDEX_NAME) {
    return null;
  }

  if (process.env.PINECONE_HOST) {
    return pinecone.index({ host: process.env.PINECONE_HOST });
  }

  return pinecone.index({ name: process.env.PINECONE_INDEX_NAME });
};

const upsertVector = async ({ id, values, metadata, namespace }) => {
  try {
    const index = getIndex();
    if (!index) return false;

    await index.upsert({
      records: [
        {
          id,
          values,
          metadata
        }
      ],
      namespace
    });

    return true;
  } catch (error) {
    console.error("Pinecone upsert error:", error?.message || error);
    return false;
  }
};

const queryVectors = async ({ vector, topK, namespace }) => {
  try {
    const index = getIndex();
    if (!index) return [];

    const result = await index.query({
      vector,
      topK,
      includeMetadata: true,
      namespace
    });

    return result?.matches || [];
  } catch (error) {
    console.error("Pinecone query error:", error?.message || error);
    return [];
  }
};

export { getIndex, upsertVector, queryVectors };
