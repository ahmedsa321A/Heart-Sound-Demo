import multer from 'multer';

// Use memoryStorage to keep the audio in RAM temporarily
const storage = multer.memoryStorage();

// File filter to only accept audio files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/webm', 'audio/ogg', 'audio/mpeg',
        'audio/mp3', 'audio/flac'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter
});