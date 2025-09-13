import express from 'express';
const router = express.Router();
import { signupUser, verifyEmail, loginUser, logoutUser, getCurrentUser, forgotPassword, resetPassword, getAllUsers, deleteUser, blockUser, activateUser } from '../controller/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

// User signup
router.post('/user/signup', signupUser);

// Verify email
router.get('/user/verify-email', verifyEmail);

// User login
router.post('/user/login', loginUser);

// User logout
router.post('/user/logout', authMiddleware, logoutUser);

// Get current authenticated user
router.get('/user', authMiddleware, getCurrentUser);

// Forgot password
router.post('/user/forgot-password', forgotPassword);

// Reset password
router.post('/user/reset-password', resetPassword);

// Get all users (admin only)
router.get('/users', adminAuthMiddleware, getAllUsers);

// Delete user by ID (admin only)
router.delete('/user/:userId', adminAuthMiddleware, deleteUser);

// Block user by ID (admin only)
router.put('/user/:userId/block', adminAuthMiddleware, blockUser);

// Activate user by ID (admin only)
router.put('/user/:userId/activate', adminAuthMiddleware, activateUser);

export default router;