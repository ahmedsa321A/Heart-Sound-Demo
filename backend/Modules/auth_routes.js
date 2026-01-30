import express from 'express';
const router = express.Router();
import { register, verifyOTP, login, logout, getMe } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/verify', verifyOTP);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;