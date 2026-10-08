import { prisma } from '../config/database.js';

export { prisma };

export class HealthRepository {
  async pingDatabase(): Promise<{ status: 'connected' | 'disconnected'; latencyMs?: number }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'disconnected',
        latencyMs: Date.now() - start,
      };
    }
  }
}

export const healthRepository = new HealthRepository();
