import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
    throw new Error('MONGODB_URI not set in environment variables');
    }
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1); 
    }
};