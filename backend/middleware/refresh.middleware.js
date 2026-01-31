import jwt from 'jsonwebtoken';
import RefreshToken from '../DB/refreshToken.model.js';
import { hashToken } from '../utils/hashToken.utils.js';

const protectRefresh = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ msg: 'No refresh token' });
    }

    try {
        // Verify signature & expiry
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const tokenHash = hashToken(refreshToken);

        const storedToken = await RefreshToken.findOne({ tokenHash });

        if (!storedToken) {
            //  Token reuse 
            return res.status(401).json({ msg: 'Refresh token reuse detected' });
        }

        // Attach user info
        req.userId = decoded.user.id;
        req.refreshTokenRecord = storedToken;

        next();
    } catch (error) {
        return res.status(401).json({ msg: 'Invalid refresh token' });
    }
};

export default protectRefresh;
