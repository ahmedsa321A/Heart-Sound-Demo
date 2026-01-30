import User from '../DB/User.js';
import UserHistory from '../DB/UserHistory.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.utils.js';

import RefreshToken from '../DB/refreshToken.model.js';
import { hashToken } from '../utils/hashToken.utils.js';
import BlacklistedToken from '../DB/blackListToken.model.js';
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

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Please verify your email first' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);     // 15m
        const refreshToken = generateRefreshToken(user._id);   // 7d

        // 4Store refresh token (hashed)
        await RefreshToken.create({
            user: user._id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Response
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email
            },
            msg: 'Logged in successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Logout User & Clear Cookie
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.decode(token);

        await BlacklistedToken.create({
            jti: decoded.jti,
            expiresAt: new Date(decoded.exp * 1000)
        });
    }

    await RefreshToken.deleteMany({ user: req.user.id });

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({ msg: 'Logged out' });
};


export const refresh = async (req, res) => {
    try {
        const { userId, refreshTokenRecord } = req;

        //  Remove old refresh token (rotation)
        await refreshTokenRecord.deleteOne();

        //  Generate new tokens
        const newAccessToken = generateAccessToken(userId);
        const newRefreshToken = generateRefreshToken(userId);

        //  Store new refresh token
        await RefreshToken.create({
            user: userId,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        //  Send cookies
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            msg: 'Token refreshed'
        });

    } catch (err) {
        console.error(err);
        res.status(401).json({ msg: 'Refresh failed' });
    }
};
