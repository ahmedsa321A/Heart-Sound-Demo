import User from '../DB/User.js';
import UserHistory from '../DB/UserHistory.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { fullName, email, password, age, gender } = req.body;

        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

        if (!user) {
            user = new User({
                fullName,
                email,
                password,
                age,
                gender,
                otp,
                otpExpires
            });
        } else {
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.password = password;
            user.fullName = fullName;
        }

        await user.save();

        // 3. Create or Update the Medical History linked to the user
        const parseBool = (value) => value === 'yes';

        const chronicCardiac = req.body.chronicCardiac || [];

        await UserHistory.findOneAndUpdate(
            { user: user._id },
            {
                user: user._id,
                familyHistory: parseBool(req.body.familyHistory),
                hypertension: parseBool(req.body.hypertension),
                diabetes: parseBool(req.body.diabetes),
                renalPathologies: parseBool(req.body.renalPathologies),
                chronicCardiacConditions: {
                    mi: chronicCardiac.includes('mi'),
                    heartFailure: chronicCardiac.includes('heart-failure'),
                    ischemia: chronicCardiac.includes('ischemia')
                }
            },
            { upsert: true, new: true }
        );


        console.log(`DEV MODE OTP: ${otp}`);


        const message = `Your verification code for CardioLens is: ${otp}\n\nIt expires in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'CardioLens Verification Code',
                message
            });

            res.status(200).json({ msg: 'Email sent. Please verify OTP.' });
        } catch (err) {
            console.error("Email sending failed (expected without valid credentials):", err.message);
            res.status(200).json({ msg: 'Email failed (check server console for OTP), but user created.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid OTP or OTP has expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.json({ msg: 'Account Verified! You can now login.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Login User & Get Token
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check User
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Please verify your email first' });
        }

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. Create Payload (No Role, just ID)
        const payload = {
            user: {
                id: user._id
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // 4. Send Cookie
        const options = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res
            .status(200)
            .cookie('token', token, options)
            .json({
                success: true,
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email
                },
                msg: 'Logged in successfully'
            });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Logout User & Clear Cookie
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, msg: 'User logged out' });
};

// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, msg: 'Not authorized' });
        }
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};