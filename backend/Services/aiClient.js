import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const aiClient = axios.create({
    baseURL: process.env.AI_URL || 'http://localhost:8000',
});

export default aiClient;
