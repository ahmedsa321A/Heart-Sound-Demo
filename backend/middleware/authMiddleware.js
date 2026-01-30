import jwt from 'jsonwebtoken';
import User from '../DB/User.js';
import BlacklistedToken from '../DB/blackListToken.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        try {
            token = req.cookies.token;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

               const blacklisted = await BlacklistedToken.findOne({ jti: decoded.jti });
        if (blacklisted) {
            return res.status(401).json({ msg: 'Token revoked' });
        }


            req.user = await User.findById(decoded.user.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

export default protect;