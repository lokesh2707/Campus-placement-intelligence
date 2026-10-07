import Redis from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;

if (env.REDIS_ENABLED) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      // Graceful error logging - do not crash application
      console.warn('⚠️ Redis error (running in degraded cache mode):', err.message);
    });
  } catch (error) {
    console.warn('⚠️ Redis could not be initialized, continuing without cache layer.');
    redisClient = null;
  }
}

export { redisClient };

export async function checkRedisHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'optional_disabled';
  latencyMs?: number;
}> {
  if (!env.REDIS_ENABLED || !redisClient) {
    return { status: 'optional_disabled' };
  }

  try {
    const start = Date.now();
    await redisClient.ping();
    const latencyMs = Date.now() - start;
    return { status: 'connected', latencyMs };
  } catch {
    return { status: 'disconnected' };
  }
}
