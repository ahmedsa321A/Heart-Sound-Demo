import Prediction from '../../DB/predections.model.js';
import User from '../../DB/User.js';
import mongoose from 'mongoose';
import { decodeUpload, predictHeartSound, InvalidAudioError } from '../../Services/inference/heartModel.js';
import { toStorageWav } from '../../Services/audioStorage.js';
import { bucket } from '../../DB/db.connection.js';



export const createPrediction = async (req, res) => {
    try {
        const userId = req.user._id;

        // Ensure file exists in memory
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No audio file provided' });
        }

        // 1. Run the model in-process (same pipeline as the former Python ai-service)
        const audio = decodeUpload(req.file.buffer);
        const result = await predictHeartSound(audio);

        // 2. Store a compact copy (mono, 4 kHz, first 30 s) in GridFS for future training,
        //    as agreed in the Terms & Privacy Policy at signup
        const stored = toStorageWav(audio);
        const uploadStream = bucket.openUploadStream(`${userId}-${Date.now()}.wav`, {
            contentType: 'audio/wav',
            metadata: {
                sampleRate: stored.sampleRate,
                durationSec: stored.durationSec,
                originalSampleRate: audio.sampleRate,
                originalSize: req.file.size
            }
        });
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve).on('error', reject);
            uploadStream.end(stored.wav);
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


// Saves the optional answers the user gave before seeing the result, or records that they skipped.
export const setPredictionLabels = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Prediction not found' });
        }
        const prediction = await Prediction.findOne({ _id: req.params.id, userId: req.user._id });
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }

        if (req.body.skipped === true) {
            prediction.labels = undefined;
            prediction.labelStatus = 'skipped';
        } else {
            const { diagnosedByDoctor, conditions, otherCondition, diagnosisMethod, chestLocation, device } = req.body.labels || {};
            prediction.labels = { diagnosedByDoctor, conditions, otherCondition, diagnosisMethod, chestLocation, device };
            prediction.labelStatus = 'submitted';
        }
        prediction.labeledAt = new Date();
        await prediction.save();

        res.status(200).json({ labelStatus: prediction.labelStatus });
    } catch (error) {
        console.error('Error saving labels:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
