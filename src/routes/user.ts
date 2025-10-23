import express from 'express';
import {getUserInfo, loginUser, registerUser} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import asyncWrapper from "../utils/asyncWrapper";

const router = express.Router();

router.post('/register', asyncWrapper(registerUser));
router.post('/login', asyncWrapper(loginUser));
router.post(
  '/testSentry',
  asyncWrapper(() => {
    throw new Error('这是一个手动系统级error上报测试');
  })
);
router.post('/me', authenticateToken, getUserInfo);

export default router;
