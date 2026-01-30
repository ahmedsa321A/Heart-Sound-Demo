import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Performance indexes
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ user: 1 });

// Auto-cleanup index
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
