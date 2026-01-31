import express from 'express';
const router = express.Router();
import { register, verifyOTP, login, logout, getMe } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import protectRefresh from '../middleware/refresh.middleware.js';
import { refresh } from '../controllers/authController.js';
import { forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController.js';
import {changePassword} from '../controllers/authController.js';

// Auth Routes
router.post('/change-password', changePassword);


router.post('/register', register);
router.post('/verify', verifyOTP);

router.post('/login', login);
router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/refresh', protectRefresh, refresh);


// Password Reset (3 steps)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp',  verifyResetOTP);
router.post('/reset-password',  resetPassword);



export default router;