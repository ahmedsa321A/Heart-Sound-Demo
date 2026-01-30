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

export default mongoose.model('BlacklistedToken', blackListTokenSchema);