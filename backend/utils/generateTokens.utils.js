// utils/generateTokens.js
import jwt from 'jsonwebtoken';

import { v4 as uuidv4 } from 'uuid';

export const generateAccessToken = (userId) => {
    return jwt.sign(
        {
            user: { id: userId },
            jti: uuidv4()  // ADD THIS
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        {
            user: {
                id: userId
            }
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: '7d'
        }
    );
};
