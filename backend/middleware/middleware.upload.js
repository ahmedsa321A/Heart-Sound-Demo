import multer from 'multer';

// Use memoryStorage to keep the audio in RAM temporarily
const storage = multer.memoryStorage();

// The in-process model reads WAV (the website and app always upload WAV)
const WAV_MIME_TYPES = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave'];

const fileFilter = (req, file, cb) => {
    const isWav = WAV_MIME_TYPES.includes(file.mimetype) || file.originalname?.toLowerCase().endsWith('.wav');
    if (isWav) {
        cb(null, true);
    } else {
        cb(Object.assign(new Error('Invalid file type. Only WAV audio files are allowed.'), { statusCode: 400 }), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter
});
