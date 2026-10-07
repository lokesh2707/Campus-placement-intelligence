import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { API_VERSION } from '@campus-os/config';
import { sendSuccess } from '../utils/response.js';

export const v1Router = Router();

v1Router.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'AI-Powered Campus Placement Intelligence Platform API',
    version: API_VERSION,
    status: 'operational',
    documentation: '/docs',
  });
});

v1Router.use('/health', healthRouter);
