import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  if (config.nodeEnv === 'production' && (config.mongoUri.includes('127.0.0.1') || config.mongoUri.includes('localhost'))) {
    console.error('\n⚠️ [Database Configuration Error]');
    console.error('Render is running in production, but MONGODB_URI is still set to localhost (127.0.0.1:27017).');
    console.error('Please configure your MONGODB_URI (e.g. MongoDB Atlas connection string) in the Render Dashboard:');
    console.error('Render Dashboard -> Your Service -> Environment -> Add Environment Variable -> MONGODB_URI\n');
  }

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
