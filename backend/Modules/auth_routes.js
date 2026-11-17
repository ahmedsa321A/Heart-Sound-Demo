import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const router = express.Router();
import { register, verifyOTP, login, logout, resendVerificationOTP } from '../controllers/authController.js';
import { getProfile } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';
import protectRefresh from '../middleware/refresh.middleware.js';
import { refresh } from '../controllers/authController.js';
import { forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController.js';
import { changePassword } from '../controllers/authController.js';
import {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    emailValidation,
    resetPasswordValidation,
    changePasswordValidation
} from '../middleware/middleware.validation.js';

// Rate limiter for sensitive auth routes, keyed by the account email (falls back to IP).
// Behind Vercel + Cloudflare + Render the client IP changes per request and can be spoofed, and
// per-account limits are what stop password and OTP guessing.
const keyByEmail = (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `email:${email}` : ipKeyGenerator(req.ip);
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    keyGenerator: keyByEmail,
    message: { msg: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth Routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/verify', authLimiter, verifyOTPValidation, verifyOTP);
router.post('/resend-otp', authLimiter, emailValidation, resendVerificationOTP);

router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', protect, logout);

router.get('/me', protect, getProfile);

router.post('/refresh', protectRefresh, refresh);

router.post('/change-password', protect, changePasswordValidation, changePassword);

// Password Reset (3 steps)
router.post('/forgot-password', authLimiter, emailValidation, forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyOTPValidation, verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, resetPassword);

export default router;