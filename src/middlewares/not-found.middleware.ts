import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route not found: [${req.method}] ${req.originalUrl}`));
};
