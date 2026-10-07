import { Router } from 'express';
import { healthRouter } from '../health/health.routes.js';
import { API_VERSION } from '@campus-os/config';
import { sendSuccess } from '../utils/response.js';

export const v1Router = Router();

v1Router.get('/', (req, res) => {
  sendSuccess(res, {
    name: 'AI-Powered Campus Placement Intelligence Platform API',
    version: API_VERSION,
    status: 'operational',
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      readiness: `/api/${API_VERSION}/health/ready`,
    },
  }, 200, undefined, undefined, req.id);
});

v1Router.use('/health', healthRouter);
