import mongoose from 'mongoose';

const UserHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    familyHistory: {
        type: Boolean,
        default: false
    },
    hypertension: {
        type: Boolean,
        default: false
    },
    diabetes: {
        type: Boolean,
        default: false
    },
    chronicCardiacConditions: {
        mi: { type: Boolean, default: false },
        heartFailure: { type: Boolean, default: false },
        ischemia: { type: Boolean, default: false }
    },
    renalPathologies: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('UserHistory', UserHistorySchema);