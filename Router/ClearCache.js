import express from 'express';
import { client as redisClient } from "../config/redisClient.js";
const router = express.Router();

export async function clearCompaniesCache() {
  const keys = await redisClient.keys('companies:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  console.log("All companies cache cleared");
}

router.get('/clear-cache', async (req, res) => {
  try {
    await clearCompaniesCache();
    res.status(200).json({ message: 'Companies cache cleared successfully.' });
  } catch (err) {
    console.error('Error clearing companies cache:', err);
    res.status(500).json({ message: 'Failed to clear companies cache', error: err.message });
  }
});

export default router;