import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

interface RequestValidationSchema {
  body?: ZodType<any>;
  query?: ZodType<any>;
  params?: ZodType<any>;
}

export const validateRequest = (schema: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        for (const key of Object.keys(req.query)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query, parsedQuery);
      }
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        for (const key of Object.keys(req.params)) {
          delete (req.params as Record<string, unknown>)[key];
        }
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.badRequest('Validation failed', formattedErrors));
      }
      return next(error);
    }
  };
};
