import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { v1Router } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendError } from './utils/response.js';
import { env } from './config/env.js';
import { API_PREFIX } from '@campus-os/config';

export function createApp(): express.Application {
  const app = express();

  // Security and core middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Root welcome ping
  app.get('/', (_req, res) => {
    res.json({
      name: 'AI-Powered Campus Placement Intelligence Platform',
      status: 'active',
      apiVersion: 'v1',
      apiEndpoint: API_PREFIX,
    });
  });

  // Mount v1 API
  app.use(API_PREFIX, v1Router);

  // 404 Handler
  app.use((req, res) => {
    sendError(res, 404, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`);
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
