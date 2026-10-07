import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function checkDatabaseHealth(): Promise<{ status: 'connected' | 'disconnected'; latencyMs?: number }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: 'connected', latencyMs };
  } catch (error) {
    return { status: 'disconnected' };
  }
}
