import jwt from 'jsonwebtoken';
import User from '../DB/User.js';
import BlacklistedToken from '../DB/blackListToken.model.js';

export const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ 
            msg: 'Not authorized, no token',
            code: 'NO_TOKEN' 
        });
    }

    try {
        // Verify token signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is blacklisted
        const blacklisted = await BlacklistedToken.findOne({ jti: decoded.jti });
        if (blacklisted) {
            return res.status(401).json({ 
                msg: 'Token revoked',
                code: 'TOKEN_REVOKED'
            });
        }

        // Get user from database
        req.user = await User.findById(decoded.user.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ 
                msg: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        next();

    } catch (error) {
        console.error('Auth error:', error.name, error.message);

        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                msg: 'Token expired',
                code: 'TOKEN_EXPIRED' // Frontend calls /refresh delwa2tty
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                msg: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        // Generic error
        return res.status(401).json({ 
            msg: 'Not authorized, token failed',
            code: 'AUTH_FAILED'
        });
    }
};

export default protect;