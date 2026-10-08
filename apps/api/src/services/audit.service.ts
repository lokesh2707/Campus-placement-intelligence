import { PrismaClient, AuditEventType } from '@prisma/client';
import { prisma } from '../repositories/health.repository.js';
import { logger } from '../utils/logger.js';

export interface AuditEventParams {
  userId?: string | null;
  event: AuditEventType;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

export class AuditService {
  constructor(private db: PrismaClient = prisma) {}

  async log(params: AuditEventParams): Promise<void> {
    return this.logEvent(params);
  }

  /**
   * Asynchronously record a security or audit event.
   * Strips any sensitive properties such as password, token, or secret.
   */
  async logEvent(params: AuditEventParams): Promise<void> {
    try {
      const sanitizedMeta = this.sanitizeMetadata(params.metadata);

      await this.db.auditLog.create({
        data: {
          userId: params.userId || null,
          event: params.event,
          requestId: params.requestId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: sanitizedMeta as any,
        },
      });

      logger.info(`[AUDIT] ${params.event} recorded`, {
        userId: params.userId,
        event: params.event,
        requestId: params.requestId,
      });
    } catch (err: any) {
      // Never let audit log failures crash user-facing auth transactions
      logger.error(`[AUDIT ERROR] Failed to record audit log: ${err?.message}`);
    }
  }

  private sanitizeMetadata(meta?: Record<string, any> | null): Record<string, any> | undefined {
    if (!meta) return undefined;

    const sanitized: Record<string, any> = {};
    const forbiddenKeys = ['password', 'token', 'refreshToken', 'secret', 'passwordHash', 'hash'];

    for (const [key, value] of Object.entries(meta)) {
      if (forbiddenKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const auditService = new AuditService();
