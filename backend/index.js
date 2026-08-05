import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import dbConnection from './DB/db.connection.js';
import cors from 'cors';

const app = express();

// Cross-Origin Resource Sharing (CORS) - Allows web app, mobile app, local IPs, and cross-origin requests
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(cookieParser());
app.use(express.json());

dbConnection();

// Health check endpoint for Azure probes
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
});
