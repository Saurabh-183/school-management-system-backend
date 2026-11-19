import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import mongoose from 'mongoose';

const startServer = async () => {
  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Server] Teacher Booking REST API running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`[Server] Health check: http://0.0.0.0:${config.port}/health`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await mongoose.connection.close(false);
      console.log('[Database] MongoDB connection closed.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if lingering
    setTimeout(() => {
      console.error('[Server] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('[Server Fatal Error]', err);
  process.exit(1);
});
