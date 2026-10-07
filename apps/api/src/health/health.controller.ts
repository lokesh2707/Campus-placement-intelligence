import { Request, Response } from 'express';
import { healthService } from './health.service.js';
import { sendSuccess } from '../utils/response.js';

export class HealthController {
  getHealth(req: Request, res: Response): void {
    const data = healthService.getLiveness();
    sendSuccess(res, data, 200, undefined, undefined, req.id);
  }

  async getReadiness(req: Request, res: Response): Promise<void> {
    const data = await healthService.getReadiness();
    const statusCode = data.status === 'ready' ? 200 : 503;
    sendSuccess(res, data, statusCode, undefined, undefined, req.id);
  }
}

export const healthController = new HealthController();
