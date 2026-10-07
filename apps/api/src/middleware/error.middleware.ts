import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Unhandled error
  console.error('Unhandled server error:', err);
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message;

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
}
