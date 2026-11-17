import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import dbConnection from './DB/db.connection.js';
import cors from 'cors';
import { warmUpModel } from './Services/inference/heartModel.js';

const app = express();

// Behind Render's load balancer (and Vercel's /api proxy): trust that many hops so the rate limiter
// sees each user's real IP instead of the proxy's.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

// CORS: only the website's origin(s) may make credentialed requests. Requests without an Origin
// header (mobile app, server-to-server, same-origin via the Vercel proxy) are unaffected.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(cookieParser());
app.use(express.json());

dbConnection();

// Health check endpoint for the host's probes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

import userRouter from './Modules/user_routes.js';
import authRouter from './Modules/auth_routes.js';
import predictionRouter from './controllers/predections.controller.js';

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/predections", predictionRouter);

// Global Error Handler (must be BEFORE app.listen)
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        msg: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    warmUpModel()
        .then(() => console.log('Heart sound model loaded'))
        .catch((err) => console.error('Failed to load heart sound model:', err));
});
