import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface MLHealthResponse {
  status: string;
  service: string;
  timestamp: string;
  version: string;
  ai_provider?: Record<string, unknown>;
}

export class MLServiceClient {
  private baseUrl: string;

  constructor(baseUrl = env.ML_SERVICE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async checkHealth(timeoutMs = 2000): Promise<{
    status: 'available' | 'unavailable';
    service?: string;
    latencyMs?: number;
    details?: MLHealthResponse;
  }> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        return {
          status: 'unavailable',
          latencyMs: Date.now() - startTime,
        };
      }

      const data = (await res.json()) as MLHealthResponse;
      return {
        status: 'available',
        service: data.service,
        latencyMs: Date.now() - startTime,
        details: data,
      };
    } catch (error: any) {
      logger.debug(`ML Service health check failed at ${this.baseUrl}: ${error.message}`);
      return {
        status: 'unavailable',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

export const mlClient = new MLServiceClient();
