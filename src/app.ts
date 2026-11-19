import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP logger
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Welcome route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Welcome to Teacher Booking Platform REST API',
      version: '1.0.0',
      docs: {
        createUser: 'POST /users',
        createSession: 'POST /sessions',
        availableSessions: 'GET /sessions/available?dateTimestamp={timestamp}',
        bookSession: 'POST /sessions/:id/book',
        completeSession: 'PATCH /sessions/:id/complete',
        userSessions: 'GET /users/:id/sessions',
      },
    });
  });

  // Mount API routes at both root and /api for convenience
  app.use(routes);
  app.use('/api', routes);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
