import 'dotenv/config';
import cookieParser from 'cookie-parser';



import express from 'express';
import dbConnection from './DB/db.connection.js';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(cookieParser());
dbConnection();

app.use(express.json());


import userRouter from './Modules/user_routes.js';
import authRouter from './Modules/auth_routes.js';

app.use("/auth", authRouter);
app.use("/users", userRouter);
// app.use("/predictions", predictionRouter);
//app.use("/audio",audioRouter);



app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, msg: 'Something went wrong!', error: err.message });
});

