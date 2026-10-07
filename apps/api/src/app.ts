import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { v1Router } from './routes/index.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './middleware/logger.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './errors/app-error.js';
import { env } from './config/env.js';
import { API_PREFIX } from '@campus-os/config';

export function createApp(): express.Application {
  const app = express();

  // 1. Request ID tracking (First middleware)
  app.use(requestIdMiddleware);

  // 2. Security headers
  app.use(helmet());

  // 3. Configurable CORS
  const corsOrigin = env.CORS_ORIGIN;
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // 4. Rate limiting
  app.use(apiRateLimiter);

  // 5. Body parsers with size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Request logging
  app.use(requestLoggerMiddleware);

  // 7. Root info
  app.get('/', (req, res) => {
    res.json({
      name: 'AI-Powered Campus Placement Intelligence Platform API',
      status: 'active',
      apiVersion: 'v1',
      apiEndpoint: API_PREFIX,
      requestId: req.id,
    });
  });

  // 8. Mount v1 API
  app.use(API_PREFIX, v1Router);

  // 9. 404 Not Found handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.path} not found`));
  });

  // 10. Centralized Error Handler (Last middleware)
  app.use(errorHandler);

  return app;
}
