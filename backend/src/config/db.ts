import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected successfully');
    console.log('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

