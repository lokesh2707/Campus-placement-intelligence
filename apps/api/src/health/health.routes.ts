import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => healthController.getHealth(req, res));
healthRouter.get('/ready', (req, res) => healthController.getReadiness(req, res));
