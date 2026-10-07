import { redisClient, checkRedisHealth } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export class RedisService {
  isAvailable(): boolean {
    return redisClient !== null && redisClient.status === 'ready';
  }

  async ping(): Promise<boolean> {
    if (!redisClient) return false;
    try {
      const res = await redisClient.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  async getHealth() {
    return checkRedisHealth();
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await redisClient!.get(key);
    } catch (err: any) {
      logger.warn(`Redis get failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (ttlSeconds) {
        await redisClient!.set(key, value, 'EX', ttlSeconds);
      } else {
        await redisClient!.set(key, value);
      }
      return true;
    } catch (err: any) {
      logger.warn(`Redis set failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await redisClient!.del(key);
      return true;
    } catch (err: any) {
      logger.warn(`Redis delete failed for key "${key}": ${err.message}`);
      return false;
    }
  }
}

export const redisService = new RedisService();
