import 'dotenv/config';
import express from 'express';
import dbConnection from './DB/db.connection.js';
const app = express();

dbConnection();

app.use(express.json());

import authRouter from './Modules/auth_routes.js';

app.use("/auth", authRouter);
//app.use("/users",userRouter);
//app.use("/predictions",predictionRouter);
//app.use("/audio",audioRouter);



app.listen(process.env.PORT, () => {
    console.log('Server is running on port 3000');
});