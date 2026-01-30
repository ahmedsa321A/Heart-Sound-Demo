import jwt from 'jsonwebtoken';
import User from '../DB/User.js';
import BlacklistedToken from '../DB/blackListToken.model.js';

const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const blacklisted = await BlacklistedToken.findOne({ jti: decoded.jti });
        if (blacklisted) {
            return res.status(401).json({ msg: 'Token revoked' });
        }

        req.user = await User.findById(decoded.user.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
};

export default protect;