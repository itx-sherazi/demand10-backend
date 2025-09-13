import express from 'express';
import { createRequest, deleteRequest, getAllRequests } from '../controller/requestController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.post('/data', createRequest);
router.get('/AllData', adminAuthMiddleware, getAllRequests);
router.delete('/deleterequest/:id', adminAuthMiddleware, deleteRequest);

export default router;