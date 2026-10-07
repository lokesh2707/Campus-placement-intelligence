import { healthRepository } from '../repositories/health.repository.js';
import { redisService } from '../services/redis.service.js';
import { mlClient } from '../services/ml.client.js';
import { ServiceHealth, ServiceReadiness } from '@campus-os/shared-types';

export class HealthService {
  getLiveness(): ServiceHealth {
    return {
      status: 'ok',
      service: 'placement-api',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }

  async getReadiness(): Promise<ServiceReadiness> {
    const [dbCheck, redisCheck, mlCheck] = await Promise.all([
      healthRepository.pingDatabase(),
      redisService.getHealth(),
      mlClient.checkHealth(1500),
    ]);

    const isReady = dbCheck.status === 'connected';

    return {
      status: isReady ? 'ready' : 'not_ready',
      service: 'placement-api',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        redis: {
          status: redisCheck.status === 'optional_disabled' ? 'disabled' : redisCheck.status,
          latencyMs: redisCheck.latencyMs,
        },
        mlService: {
          status: mlCheck.status,
          service: mlCheck.service,
          latencyMs: mlCheck.latencyMs,
        },
      },
    };
  }
}

export const healthService = new HealthService();
