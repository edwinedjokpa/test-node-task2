const redis = require("redis");
require("dotenv").config();

const REDIS_URL = process.env.REDIS_URL;

// Initialize local Redis client
const redisClient = redis.createClient({
  url: REDIS_URL,
});

// Handle Redis errors
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Function to clear Redis data
const clearRedisData = async () => {
  try {
    await redisClient.flushAll();
    console.log("Redis data cleared.");
  } catch (err) {
    console.error("Error clearing Redis data:", err);
  }
};

// Connect the Redis client
async function connectRedis() {
  try {
    await redisClient.connect();
    await clearRedisData();
    console.log("Redis client connected");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
  }
}

connectRedis();

module.exports = redisClient;
