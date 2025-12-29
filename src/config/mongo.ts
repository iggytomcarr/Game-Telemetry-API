import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/game_telemetry';
  
  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connect(uri);
}

export function getMongoose(): typeof mongoose {
  return mongoose;
}
