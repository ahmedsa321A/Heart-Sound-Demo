import Prediction from '../../DB/predections.model.js';
import User from '../../DB/User.js';
import { predictHeartSound, InvalidAudioError } from '../../Services/inference/heartModel.js';
import { bucket } from '../../DB/db.connection.js';



export const createPrediction = async (req, res) => {
    try {
        const userId = req.user._id;

        // Ensure file exists in memory
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No audio file provided' });
        }

        const audioBuffer = req.file.buffer;

        // 1. Run the model in-process (same pipeline as the former Python ai-service)
        const result = await predictHeartSound(audioBuffer);

        // 2. Store the raw audio in GridFS
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype || 'audio/wav'
        });
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve).on('error', reject);
            uploadStream.end(audioBuffer);
        });

        // 3. Save the prediction
        const newPrediction = new Prediction({
            userId,
            audioId: uploadStream.id,
            predictionResult: result.predictionResult,
            predictionScore: result.predictionScore
        });

        await newPrediction.save();

        res.status(201).json(newPrediction);
    } catch (error) {
        if (error instanceof InvalidAudioError) {
            return res.status(400).json({ message: 'Invalid audio file', detail: error.message });
        }
        const errorDetail = error.message;
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
