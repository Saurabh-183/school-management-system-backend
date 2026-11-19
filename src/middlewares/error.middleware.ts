import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { HTTP_STATUS } from '../constants/index.js';
import { config } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = 'Internal Server Error';
  let errors: unknown = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Mongoose duplicate key error (E11000)
  else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `Duplicate value '${duplicatedValue}' for field: '${duplicatedField}'. Must be unique.`;
  }
  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}: '${err.value}'`;
  }
  // Handle Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Database validation failed';
    errors = Object.values(err.errors || {}).map((item: any) => ({
      field: item.path,
      message: item.message,
    }));
  }
  // Handle malformed JSON body
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Malformed JSON in request body';
  } else if (err.message) {
    message = err.message;
  }

  // Development logging
  if (config.nodeEnv === 'development' && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error('[Unhandled Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(config.nodeEnv === 'development' && err.stack ? { stack: err.stack } : {}),
  });
};
