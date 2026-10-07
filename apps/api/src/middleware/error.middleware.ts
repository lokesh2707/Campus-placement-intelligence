import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details, requestId);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details, requestId);
    return;
  }

  // Unhandled / system error
  logger.error(`Unhandled error processing ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    name: err.name,
  }, requestId);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message, undefined, requestId);
}
