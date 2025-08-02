import express from 'express';
import {getUserInfo, sayHello} from '../controllers/userController.js';
import {authenticateToken} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/hello', sayHello);
router.post('/me', authenticateToken, getUserInfo);

export default router;
