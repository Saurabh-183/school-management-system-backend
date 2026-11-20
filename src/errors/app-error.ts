import { HTTP_STATUS } from '../constants/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown) {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static notFound(message: string) {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message: string) {
    return new AppError(message, HTTP_STATUS.CONFLICT);
  }

  static forbidden(message: string) {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
  }

  static internal(message = 'Internal Server Error') {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, undefined, false);
  }
}
