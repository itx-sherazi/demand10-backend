import express from "express";
import { 
  searchCompanies,
  submitReview,
  getAllReviews,
  getUserReviews,
  getCompanyReviews,
  approveReview,
  rejectReview,
  getCompanyWithRating,
  deleteReview
} from "../controller/ReviewController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/search-companies", searchCompanies);
router.get("/company/:companyId/reviews", getCompanyReviews);
router.get("/company/:companyId", getCompanyWithRating);

// New slug-based routes for SEO-friendly URLs
router.get("/company-by-slug/:slug/reviews", getCompanyReviews);
router.get("/company-by-slug/:slug", getCompanyWithRating);

// User routes (authenticated)
router.post("/submit", authMiddleware, submitReview);
router.get("/user-reviews", authMiddleware, getUserReviews);

// Admin routes (authenticated admin)
router.get("/all", adminAuthMiddleware, getAllReviews);
router.put("/approve/:reviewId", adminAuthMiddleware, approveReview);
router.put("/reject/:reviewId", adminAuthMiddleware, rejectReview);
router.delete("/delete/:reviewId", adminAuthMiddleware, deleteReview);

export default router;