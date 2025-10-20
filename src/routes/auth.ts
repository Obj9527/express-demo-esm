import express from 'express';
import { loginUser, registerUser } from '../controllers/userController';
import asyncWrapper from '../utils/asyncWrapper.js';

const router = express.Router();

router.post('/register', asyncWrapper(registerUser));
router.post('/login', asyncWrapper(loginUser));
router.post(
  '/testSentry',
  asyncWrapper(() => {
    throw new Error('这是一个手动系统级error上报测试');
  })
);

export default router;
