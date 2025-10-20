import express from 'express';
import { getUserInfo } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/me', authenticateToken, getUserInfo);

export default router;
