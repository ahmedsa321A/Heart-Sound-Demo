import mongoose from 'mongoose';

// We create a variable to hold the bucket instance
export let bucket;

export const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, { 
            serverSelectionTimeoutMS: 30000 
        });

        console.log('Database connected successfully');

        // 1. Get the native driver connection
        const db = mongoose.connection.db;

        // 2. Initialize the GridFS bucket
        // 'audio_recordings' will be the name of your collections in Compass
        bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'audio_recordings'
        });

    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw new Error('Database connection failed');
    }
};

export default dbConnection;