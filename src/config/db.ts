import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB:`, error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] MongoDB connection error:', err);
});
