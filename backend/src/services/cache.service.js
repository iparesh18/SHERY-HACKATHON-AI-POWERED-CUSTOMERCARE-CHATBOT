import { redis } from "./redis.service.js";

const getCache = async (key) => {
  try {
    const value = await redis.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("Cache get error:", error?.message || error);
    return null;
  }
};

const setCache = async (key, value, ttl) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
    return true;
  } catch (error) {
    console.error("Cache set error:", error?.message || error);
    return false;
  }
};

export { getCache, setCache };
