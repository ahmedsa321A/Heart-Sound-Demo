import Prediction from '../../DB/predections.model.js';
import User from '../../DB/User.js';
import aiClient from '../../Services/aiClient.js';
import FormData from 'form-data';
import { bucket } from '../../DB/db.connection.js';



export const createPrediction = async (req, res) => {
    try {
        const userId = req.user._id;

        // Ensure file exists in memory
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No audio file provided' });
        }

        const audioBuffer = req.file.buffer;

        // 1. Save the Raw Audio to GridFS in the background
        // We do this manually now since we are using memoryStorage
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype || 'audio/wav'
        });
        uploadStream.end(audioBuffer);
        const audioId = uploadStream.id;

        // 2. Prepare to send to Python FastAPI directly from RAM
        const form = new FormData();
        // We pass the buffer directly - no need to download from GridFS!
        form.append('file', audioBuffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype || 'audio/wav'
        });

        // 3. Call the Python AI Service
        const aiResponse = await aiClient.post('/predict', form, {
            headers: form.getHeaders(),
        });

        // 4. Save the AI result to your "Predictions Table"
        const newPrediction = new Prediction({
            userId,
            audioId, // This is the ID from the uploadStream above
            predictionResult: aiResponse.data.predictionResult,
            predictionScore: aiResponse.data.predictionScore
        });

        await newPrediction.save();

        res.status(201).json(newPrediction);
    } catch (error) {
        const errorDetail = error.response?.data?.detail || error.message;
        console.error('AI Service Error details:', errorDetail);
        res.status(500).json({
            message: 'AI Service Error',
            detail: errorDetail
        });
    }
};



export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Parallel Execution
        const [totalRecordings, normalResults, recentActivity] = await Promise.all([
            Prediction.countDocuments({ userId }),
            Prediction.countDocuments({ userId, predictionResult: 'Normal' }),
            Prediction.find({ userId }).sort({ createdAt: -1 }).limit(4)
        ]);

        res.status(200).json({
            recentActivity,
            stats: {
                totalRecordings,
                normalResults
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
