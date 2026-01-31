import multer from 'multer';

// Use memoryStorage to keep the audio in RAM temporarily
const storage = multer.memoryStorage();

export const upload = multer({ storage });