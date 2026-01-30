import rateLimit from 'express-rate-limit';

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        msg: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true
});

// OTP verification limiter - 3 attempts per 10 minutes
export const otpVerifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 attempts
    message: {
        msg: 'Too many OTP verification attempts. Please request a new OTP.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// OTP generation limiter - 3 requests per hour per email
export const otpGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 OTP requests
    message: {
        msg: 'Too many OTP requests. Please try again after 1 hour.'
    },
    keyGenerator: (req) => {
        // Use email instead of IP to prevent abuse
        return req.body.email || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        msg: 'Too many password reset requests. Please try again later.'
    }
});