import express from 'express';
const router = express.Router();
import {
  submitClaim,
  getAllClaims,
  getUserClaims,
  approveClaim,
  rejectClaim,
  deleteClaim, // Add this import
  checkEditAccess,
  checkEditAccessBySlug
} from '../controller/CompanyClaimController.js';

// Import auth middleware
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

// Submit a company claim (website users)
router.post('/claim/submit', authMiddleware, submitClaim);

// Get all claims (admin only)
router.get('/claims', adminAuthMiddleware, getAllClaims);

// Get user's claims (website users)
router.get('/claims/user', authMiddleware, getUserClaims);

// Approve a claim (admin only)
router.put('/claim/approve/:claimId', adminAuthMiddleware, approveClaim);

// Reject a claim (admin only)
router.put('/claim/reject/:claimId', adminAuthMiddleware, rejectClaim);

// Delete a claim (admin only)
router.delete('/claim/:claimId', adminAuthMiddleware, deleteClaim); // Add this route

// Check if user has edit access to a company (website users) - by ID (existing)
router.get('/claim/access/:companyId', authMiddleware, checkEditAccess);

// Check if user has edit access to a company (website users) - by slug (new)
router.get('/claim/access-by-slug/:slug', authMiddleware, checkEditAccessBySlug);

export default router;