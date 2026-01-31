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
    try {
        const token = req.cookies.token;
        
        if (token) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.jti) {
                    await BlacklistedToken.create({
                        jti: decoded.jti,
                        expiresAt: new Date(decoded.exp * 1000)
                    });
                }
            } catch (err) {
                console.error('Token decode error:', err);
            }
        }

        // Delete all refresh tokens for this user
        if (req.user && req.user.id) {
            await RefreshToken.deleteMany({ user: req.user.id });
        }

        res.clearCookie('token');
        res.clearCookie('refreshToken');

        res.json({ msg: 'Logged out' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Logout failed' });
    }
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


export const forgotPassword = async (req, res) => {
    try { 
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ 
                msg: 'If that email exists, we sent a reset code.' 
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({ 
                msg: 'Please verify your email first' 
            });
        }

    

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        user.otp = hashedOTP;
        user.otpExpires = otpExpires;
      

        await user.save();

        console.log(`🔐 DEV MODE - Password Reset OTP for ${email}: ${otp}`);

        const message = `Your password reset code for CardioLens is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'CardioLens - Password Reset Code',
                message
            });

            res.status(200).json({ 
                msg: 'Password reset code sent to your email.' 
            });
        } catch (err) {
            console.error("Email sending failed:", err.message);
            
            // Clear OTP if email fails
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            
            res.status(500).json({ 
                msg: 'Failed to send email. Please try again.' 
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};



export const verifyResetOTP = async (req, res) => {
    try {   
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            otpExpires: { $gt: Date.now() }
        });

        if (!user || !user.otp) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // ... OTP verification logic ...

        const isMatch = await bcrypt.compare(otp, user.otp);
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });

            
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 15 * 60 * 1000;

        const hashedResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetToken = hashedResetToken;
        user.resetTokenExpires = resetTokenExpires;
        user.otp = undefined;
    

        await user.save();

        res.cookie('resetToken', resetToken, {
            httpOnly: true,        
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict',   
            maxAge: 15 * 60 * 1000 
        });

        res.status(200).json({ 
            msg: 'OTP verified successfully. You can now reset your password.',
            expiresIn: 15 * 60
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};




export const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        const resetToken = req.cookies.resetToken;

        if (!resetToken) {
            return res.status(400).json({ 
                msg: 'Reset token missing. Please verify OTP again.' 
            });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ 
                msg: 'Password must be at least 8 characters' 
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            // Clear invalid/expired token
            res.clearCookie('resetToken');
            
            return res.status(400).json({ 
                msg: 'Invalid or expired reset token. Please request a new code.' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetToken = undefined;
        user.resetTokenExpires = undefined;

        await user.save();

        // Clear cookie after successful reset
        res.clearCookie('resetToken');

        // Invalidate all existing sessions 
        await RefreshToken.deleteMany({ user: user._id });

        res.status(200).json({ 
            msg: 'Password reset successful. Please login with your new password.' 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                msg: 'Please provide current password, new password, and confirmation' 
            });
        }

        // Check if new password matches confirmation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                msg: 'New password and confirmation do not match' 
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ 
                msg: 'New password must be at least 8 characters long' 
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({ 
                msg: 'New password must be different from current password' 
            });
        }

        // Get user from database (req.user is set by protect middleware)
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ 
                msg: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        // Optional: Invalidate all other sessions (force re-login on all devices)
        // This is a security best practice when password changes
        await RefreshToken.deleteMany({ user: user._id });

        // Clear current session cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');

        res.status(200).json({ 
            msg: 'Password changed successfully. Please login again with your new password.',
            requireLogin: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};