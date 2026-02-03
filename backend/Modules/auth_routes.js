import express from 'express';
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

// Auth Routes
router.post('/change-password', protect, changePasswordValidation, changePassword);


router.post('/register', registerValidation, register);
router.post('/verify', verifyOTPValidation, verifyOTP);
router.post('/resend-otp', emailValidation, resendVerificationOTP);

router.post('/login', loginValidation, login);
router.post('/logout', logout);

router.get('/me', protect, getProfile);

router.post('/refresh', protectRefresh, refresh);


// Password Reset (3 steps)
router.post('/forgot-password', emailValidation, forgotPassword);
router.post('/verify-reset-otp', verifyOTPValidation, verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, resetPassword);



export default router;