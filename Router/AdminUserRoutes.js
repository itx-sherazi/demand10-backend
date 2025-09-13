import express from 'express'
const router = express.Router();
import { deleteUserAdmin, getAllUsersAdmin, loginUserAdmin, signinUserAdmin } from '../controller/AdminuserController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

router.post('/login', loginUserAdmin);
router.post('/signin', signinUserAdmin);
router.get("/getuser", adminAuthMiddleware, getAllUsersAdmin);
router.delete("/users/:userId", adminAuthMiddleware, deleteUserAdmin);

export default router;