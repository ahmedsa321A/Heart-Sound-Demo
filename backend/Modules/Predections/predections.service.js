import Prediction from '../../DB/predections.model.js';
import User from '../../DB/user.model.js';
import axios from 'axios';
import FormData from 'form-data';
import { bucket } from '../DB/db.connection.js'; // Your GridFS bucket



export const createPrediction = async (req, res) => {
    try {
        const userId = req.userid;
        const audioId = req.file.id;

        // 1. Get the Raw Audio from GridFS as a Stream
        const downloadStream = bucket.openDownloadStream(audioId);

        // 2. Prepare to send to Python FastAPI
        const form = new FormData();
         form.append('file', downloadStream, { 
            filename: req.file.filename,
            contentType: req.file.contentType || 'audio/wav' // ✅ Add content type
        });
        // 3. Call the Python AI Service
        const aiResponse = await axios.post('http://localhost:8000/predict', form, {
            headers: form.getHeaders(),
        });

        // 4. Save the AI result to your "Predictions Table"
        const newPrediction = new Prediction({
            userId,
            audioId,
            predictionResult: aiResponse.data.predictionResult,
            predictionScore: aiResponse.data.predictionScore
        });

        await newPrediction.save();

        res.status(201).json(newPrediction);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'AI Service Error' });
    }
};


export const getPredictions = async (req, res) => {
    try {
        const userId = req.userid;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const predictions = await Prediction.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(predictions);
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};




