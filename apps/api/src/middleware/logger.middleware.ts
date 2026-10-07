import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.id;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(
      level,
      `${req.method} ${req.originalUrl || req.url} ${statusCode} - ${durationMs}ms`,
      {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      requestId
    );
  });

  next();
}
