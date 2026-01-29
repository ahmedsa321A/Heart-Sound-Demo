import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';

const storage = new GridFsStorage({
    url: process.env.DB_URL_LOCAL,
    options: { serverSelectionTimeoutMS: 30000 },
    file: (req, file) => {
        return {
            bucketName: 'audio_recordings', // Must match your bucket name in db.connection.js
            filename: `${Date.now()}-heart-sound-${file.originalname}`
        };
    }
});

export const upload = multer({ storage });