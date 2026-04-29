import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const aiClient = axios.create({
    baseURL: process.env.AI_URL ,
});

export default aiClient;
