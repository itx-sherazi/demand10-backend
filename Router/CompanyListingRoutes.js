import express from 'express';
const router = express.Router();
import {
  submitCompanyListing,
  getAllListingRequests,
  getUserListingRequests,
  approveListingRequest,
  rejectListingRequest,
  deleteListingRequest, // Add this import
  getCategoriesWithSubcategories
} from '../controller/CompanyListingController.js';

// Import auth middleware
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { upload } from '../controller/CompanyListingController.js';

// Get all categories with subcategories (for frontend form)
router.get('/listing/categories-with-subcategories', getCategoriesWithSubcategories);

// Submit a company listing request (website users)
router.post('/listing/submit', authMiddleware, upload.single('image'), submitCompanyListing);

// Get all listing requests (admin only)
router.get('/listings', adminAuthMiddleware, getAllListingRequests);

// Get user's listing requests (website users)
router.get('/listings/user', authMiddleware, getUserListingRequests);

// Approve a listing request (admin only)
router.put('/listing/approve/:requestId', adminAuthMiddleware, approveListingRequest);

// Reject a listing request (admin only)
router.put('/listing/reject/:requestId', adminAuthMiddleware, rejectListingRequest);

// Delete a listing request (admin only)
router.delete('/listing/:requestId', adminAuthMiddleware, deleteListingRequest); // Add this route

export default router;