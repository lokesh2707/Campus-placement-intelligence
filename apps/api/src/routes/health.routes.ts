import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database.js';
import { checkRedisHealth } from '../config/redis.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { SystemHealthStatus } from '@campus-os/shared-types';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  let mlStatus: 'available' | 'unavailable' | 'unknown' = 'unknown';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const mlRes = await fetch(`${env.ML_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    mlStatus = mlRes.ok ? 'available' : 'unavailable';
  } catch {
    mlStatus = 'unavailable';
  }

  const isDegraded =
    dbHealth.status !== 'connected' ||
    (env.REDIS_ENABLED && redisHealth.status !== 'connected');

  const healthData: SystemHealthStatus = {
    status: isDegraded ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: dbHealth,
      redis: redisHealth,
      mlService: {
        status: mlStatus,
        provider: 'ollama_local',
      },
    },
  };

  sendSuccess(res, healthData, isDegraded ? 200 : 200, 'System health report');
});
