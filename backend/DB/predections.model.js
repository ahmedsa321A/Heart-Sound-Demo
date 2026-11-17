import mongoose from 'mongoose';
import { LABEL_OPTIONS } from '../utils/labels.js';

const predictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming there is a User model
    },
    audioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'audio_recordings.files', // Links to the GridFS file metadata
        required: true
    },
    predictionResult: {
        type: String,
        required: true
    },

    predictionScore: {
        type: Number,
        required: true
    },
    // Optional answers from the user, asked before the result is shown (training labels)
    labels: {
        diagnosedByDoctor: { type: String, enum: LABEL_OPTIONS.diagnosedByDoctor },
        conditions: [{ type: String, enum: LABEL_OPTIONS.conditions }],
        otherCondition: { type: String, trim: true, maxlength: 200 },
        diagnosisMethod: { type: String, enum: LABEL_OPTIONS.diagnosisMethod },
        chestLocation: { type: String, enum: LABEL_OPTIONS.chestLocation },
        device: { type: String, enum: LABEL_OPTIONS.device }
    },
    labelStatus: {
        type: String,
        enum: ['pending', 'submitted', 'skipped'],
        default: 'pending'
    },
    labeledAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;