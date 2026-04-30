import jwt from "jsonwebtoken";
import { redis } from "./redis.service.js";

const getTokenTtlSeconds = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) {
    return 0;
  }

  return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
};

const blacklistToken = async (token, ttl) => {
  if (!token) {
    return false;
  }

  const remainingTtl = Number.isFinite(ttl) ? ttl : getTokenTtlSeconds(token);
  if (remainingTtl <= 0) {
    return false;
  }

  try {
    await redis.set(`blacklist:${token}`, "1", "EX", remainingTtl);
    return true;
  } catch (error) {
    console.error("Blacklist set error:", error?.message || error);
    return false;
  }
};

const isBlacklisted = async (token) => {
  if (!token) {
    return false;
  }

  try {
    const value = await redis.get(`blacklist:${token}`);
    return Boolean(value);
  } catch (error) {
    console.error("Blacklist check error:", error?.message || error);
    return false;
  }
};

export { blacklistToken, isBlacklisted };
