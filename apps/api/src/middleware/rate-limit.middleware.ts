import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 500, // Max requests per IP per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.', undefined, req.id);
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints (login, register, password reset).
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 30, // 30 requests per IP per 15 minutes in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      undefined,
      req.id
    );
  },
});
