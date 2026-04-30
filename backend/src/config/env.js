import dotenv from "dotenv";

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  redisHost: process.env.REDIS_HOST || "",
  redisPort: process.env.REDIS_PORT || "6379",
  redisPassword: process.env.REDIS_PASSWORD || "",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

export { env };
