import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
    patientId: {
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;