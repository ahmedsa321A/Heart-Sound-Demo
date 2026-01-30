import jwt from 'jsonwebtoken';
import User from '../DB/User.js';

const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.user.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ msg: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

export default protect;