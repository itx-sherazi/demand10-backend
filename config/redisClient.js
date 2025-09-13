import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Validate Redis configuration
const validateRedisConfig = () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not found in environment variables, using default: redis://127.0.0.1:6379');
  }
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
};

const redisUrl = validateRedisConfig();

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
  // Don't exit the process, just log the error
});

client.on("connect", () => {
  console.log("✅ Redis Client Connected");
});

client.on("ready", () => {
  console.log("✅ Redis Client Ready");
});

client.on("reconnecting", () => {
  console.log("🔄 Redis Client Reconnecting");
});

client.on("end", () => {
  console.log("🔚 Redis Client Connection Ended");
});

async function connectRedis() {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("✅ Redis connected successfully");
    } else {
      console.log("ℹ️  Redis already connected");
    }
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
    // Don't exit the process, let the application continue without Redis
  }
}

export { client, connectRedis };