import express from "express";
import {
  createBadge,
  getAllBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
  assignBadgeToCompany,
  removeBadgeFromCompany,
  getCompanyBadges,
  updateCompanyBadge,
  getAllCompanyBadges,
  getCompanyBadgesForFrontend,
  updateCompanyBadgeHomepage // Add this import
} from "../controller/BadgeController.js";
import badgeMulter from "../middleware/badgeMulter.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Public routes (for frontend)
router.get("/badges/public/:companyId", getCompanyBadgesForFrontend);

// Badge Management Routes (Admin only)
router.post(
  "/badges",
  adminAuthMiddleware,
  badgeMulter.single("image"),
  createBadge
);

router.get("/badges", adminAuthMiddleware, getAllBadges);
router.get("/badges/:id", adminAuthMiddleware, getBadgeById);

router.put(
  "/badges/:id",
  adminAuthMiddleware,
  badgeMulter.single("image"),
  updateBadge
);

router.delete("/badges/:id", adminAuthMiddleware, deleteBadge);

// Company Badge Assignment Routes (Admin only)
router.post("/company-badges", adminAuthMiddleware, assignBadgeToCompany);

// More specific route should come before the generic one with :id
router.put("/company-badges/homepage", adminAuthMiddleware, updateCompanyBadgeHomepage);
router.put("/company-badges/:id", adminAuthMiddleware, updateCompanyBadge);
router.delete("/company-badges/:id", adminAuthMiddleware, removeBadgeFromCompany);
router.get("/company-badges", adminAuthMiddleware, getAllCompanyBadges);
router.get("/company-badges/company/:companyId", adminAuthMiddleware, getCompanyBadges);

export default router;