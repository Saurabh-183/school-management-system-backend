import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teacher_booking_db',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-teacher-booking-app-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
