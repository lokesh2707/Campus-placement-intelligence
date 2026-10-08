import { PrismaClient, Session } from '@prisma/client';
import { prisma } from './health.repository.js';

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}

export class SessionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(data: CreateSessionData): Promise<Session> {
    return this.db.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        expiresAt: data.expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async findByTokenHash(refreshTokenHash: string): Promise<Session | null> {
    return this.db.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  async findById(id: string): Promise<Session | null> {
    return this.db.session.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return this.db.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async rotateRefreshToken(
    sessionId: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date
  ): Promise<Session> {
    return this.db.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt: new Date(),
        expiresAt: newExpiresAt,
      },
    });
  }

  async revokeSession(id: string, reason: string): Promise<Session> {
    return this.db.session.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async revokeAllUserSessions(userId: string, reason: string): Promise<number> {
    const result = await this.db.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
    return result.count;
  }
}

export const sessionRepository = new SessionRepository();
