import Redis from "ioredis";
import { env } from "../config/env.js";

const buildRedisOptions = () => {
  const host = env.redisHost;
  const port = Number(env.redisPort || 6379);
  const password = env.redisPassword || undefined;
  const useTls = env.redisTls || host.includes("redislabs.com") || host.includes("redis.cloud");

  return {
    host,
    port,
    password,
    tls: useTls ? {} : undefined,
    retryStrategy: (times) => Math.min(times * 200, 3000)
  };
};

const redis = env.redisUrl
  ? new Redis(env.redisUrl, { retryStrategy: (times) => Math.min(times * 200, 3000) })
  : new Redis(buildRedisOptions());

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis error", error?.message || error);
});

export { redis };
