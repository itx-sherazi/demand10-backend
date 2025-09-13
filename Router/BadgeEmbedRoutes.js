import express from "express";
import { generateBadgeEmbed, getBadgeEmbedInfo, getBadgeReferralStats } from "../controller/BadgeEmbedController.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import cors from "cors";

const router = express.Router();

// CORS options for public embed endpoints (more permissive)
const embedCorsOptions = {
  origin: true, // Reflect the request origin
  credentials: false, // Don't send credentials for public endpoints
  optionsSuccessStatus: 200,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['ETag', 'Cache-Control']
};

// Additional CORS options for preflight requests
const preflightCorsOptions = {
  origin: true,
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['ETag', 'Cache-Control']
};

// Apply CORS middleware to all routes
router.use(cors(embedCorsOptions));

// Handle preflight requests explicitly
router.options('/badges/embed/:companyId', cors(preflightCorsOptions));
router.options('/badges/embed-info/:companyId', cors(preflightCorsOptions));

// Generate badge image for embedding on external websites (public, permissive CORS)
router.get("/badges/embed/:companyId", cors(embedCorsOptions), generateBadgeEmbed);

// Get badge information for embedding (JSON response) (public, permissive CORS)
router.get("/badges/embed-info/:companyId", cors(embedCorsOptions), getBadgeEmbedInfo);

// Get badge referral statistics (Admin only)
router.get("/badges/referral-stats", adminAuthMiddleware, getBadgeReferralStats);

export default router;