import express from 'express';
const router = express.Router();
import { register, verifyOTP, login, logout } from '../controllers/authController.js';
import protectRefresh from '../middleware/refresh.middleware.js';
import { refresh } from '../controllers/authController.js';
import { forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController.js';

router.post('/register', register);
router.post('/verify', verifyOTP);


router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', protectRefresh, refresh);


// Password Reset (3 steps)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp',  verifyResetOTP);
router.post('/reset-password',  resetPassword);

export default router;