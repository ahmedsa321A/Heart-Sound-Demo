
import { body, validationResult } from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const registerValidation = [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('age').isNumeric().withMessage('Age must be a number'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
    validate
];

export const loginValidation = [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

export const verifyOTPValidation = [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('otp').notEmpty().withMessage('OTP is required'),
    validate
];

export const emailValidation = [
    body('email').isEmail().withMessage('Please include a valid email'),
    validate
];

export const resetPasswordValidation = [
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate
];

export const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    validate
];
