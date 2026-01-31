import mongoose from 'mongoose';
const blackListTokenSchema = new mongoose.Schema({
    jti: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});


// Performance indexes
blackListTokenSchema.index({ jti: 1 }, { unique: true });

// Auto-cleanup index (deletes docs after expiresAt)
blackListTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('BlacklistedToken', blackListTokenSchema);