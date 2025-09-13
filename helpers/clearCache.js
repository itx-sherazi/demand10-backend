import { client as redisClient } from '../config/redisClient.js'; // Fixed import path

async function clearCompaniesCache() {
  const keys = await redisClient.keys('companies:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  console.log("All companies cache cleared");
  process.exit();
}

clearCompaniesCache();
