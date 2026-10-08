import { PrismaClient, EmailVerificationToken, PasswordResetToken } from '@prisma/client';
import { prisma } from './health.repository.js';

export class TokenRepository {
  constructor(private db: PrismaClient = prisma) {}

  // --- Email Verification Tokens ---

  async createVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<EmailVerificationToken> {
    // Invalidate any existing unused tokens for this user
    await this.db.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return this.db.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValidVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.db.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async markVerificationTokenUsed(id: string): Promise<EmailVerificationToken> {
    return this.db.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  // --- Password Reset Tokens ---

  async createResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetToken> {
    // Invalidate any existing unused tokens for this user
    await this.db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return this.db.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValidResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async markResetTokenUsed(id: string): Promise<PasswordResetToken> {
    return this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

export const tokenRepository = new TokenRepository();
