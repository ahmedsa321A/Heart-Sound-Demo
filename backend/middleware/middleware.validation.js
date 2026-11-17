
import { body, validationResult } from 'express-validator';
import { LABEL_OPTIONS } from '../utils/labels.js';

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
    body('acceptTerms').custom((value) => value === true).withMessage('You must accept the Terms & Privacy Policy'),
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

// Optional answers before the result: either { skipped: true } or { labels: {...} }, every field optional
export const predictionLabelsValidation = [
    body('skipped').optional().isBoolean({ strict: true }),
    body('labels').optional().isObject(),
    body('labels.diagnosedByDoctor').optional().isIn(LABEL_OPTIONS.diagnosedByDoctor),
    body('labels.conditions').optional().isArray({ max: LABEL_OPTIONS.conditions.length }),
    body('labels.conditions.*').isIn(LABEL_OPTIONS.conditions),
    body('labels.otherCondition').optional().isString().trim().isLength({ max: 200 }),
    body('labels.diagnosisMethod').optional().isIn(LABEL_OPTIONS.diagnosisMethod),
    body('labels.chestLocation').optional().isIn(LABEL_OPTIONS.chestLocation),
    body('labels.device').optional().isIn(LABEL_OPTIONS.device),
    validate
];
