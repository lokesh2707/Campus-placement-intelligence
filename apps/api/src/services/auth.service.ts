import { User, Role, UserStatus, AuditEventType } from '@prisma/client';
import { UserRole } from '@campus-os/shared-types';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from '@campus-os/validation';
import {
  REFRESH_TOKEN_EXPIRY_DAYS,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from '@campus-os/config';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { sessionRepository, SessionRepository } from '../repositories/session.repository.js';
import { tokenRepository, TokenRepository } from '../repositories/token.repository.js';
import { auditService, AuditService } from './audit.service.js';
import { emailService } from './email/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '../errors/app-error.js';

export interface RequestMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export interface AuthResult {
  user: SafeUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  sessionId: string;
}

export class AuthService {
  constructor(
    private users: UserRepository = userRepository,
    private sessions: SessionRepository = sessionRepository,
    private tokens: TokenRepository = tokenRepository,
    private audit: AuditService = auditService
  ) {}

  /**
   * Register a new user (defaults to STUDENT; prevents public privileged role creation).
   */
  async register(input: RegisterInput, meta: RequestMetadata): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check for privileged roles in public registration
    if (
      input.role &&
      (input.role === UserRole.SUPER_ADMIN || input.role === UserRole.PLACEMENT_ADMIN)
    ) {
      throw new ForbiddenError('Privileged administrator roles cannot be registered through public signup');
    }

    // Check existing email
    const existingUser = await this.users.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(input.password);

    // Create user in database
    const assignedRole = (input.role as unknown as Role) || Role.STUDENT;
    const user = await this.users.create({
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: assignedRole,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
      collegeId: input.collegeId,
      departmentId: input.departmentId,
      companyId: input.companyId,
    });

    // Create email verification token & send email
    const rawVerificationToken = generateRandomToken(32);
    const verificationHash = hashToken(rawVerificationToken);
    const verificationExpiry = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
    );
    await this.tokens.createVerificationToken(user.id, verificationHash, verificationExpiry);
    await emailService.sendVerificationEmail(user.email, rawVerificationToken, user.firstName);

    // Create initial session & tokens
    const rawRefreshToken = generateRandomToken(40);
    const refreshHash = hashToken(rawRefreshToken);
    const sessionExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const session = await this.sessions.create({
      userId: user.id,
      refreshTokenHash: refreshHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: sessionExpiry,
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      sessionId: session.id,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
      companyId: user.companyId,
    });

    await this.audit.logEvent({
      userId: user.id,
      event: AuditEventType.USER_REGISTERED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { role: user.role, email: user.email },
    });

    await this.audit.logEvent({
      userId: user.id,
      event: AuditEventType.SESSION_CREATED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      user: this.toSafeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 15 * 60,
      },
      sessionId: session.id,
    };
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(input: LoginInput, meta: RequestMetadata): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    if (!user) {
      await this.audit.logEvent({
        event: AuditEventType.LOGIN_FAILED,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { attemptedEmail: normalizedEmail, reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      await this.audit.logEvent({
        userId: user.id,
        event: AuditEventType.LOGIN_FAILED,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { reason: 'PASSWORD_MISMATCH' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact the administrator.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenError('Your account is currently inactive.');
    }

    await this.users.updateLastLogin(user.id);

    // Create session
    const rawRefreshToken = generateRandomToken(40);
    const refreshHash = hashToken(rawRefreshToken);
    const sessionExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const session = await this.sessions.create({
      userId: user.id,
      refreshTokenHash: refreshHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: sessionExpiry,
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      sessionId: session.id,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
      companyId: user.companyId,
    });

    await this.audit.logEvent({
      userId: user.id,
      event: AuditEventType.LOGIN_SUCCESS,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      user: this.toSafeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 15 * 60,
      },
      sessionId: session.id,
    };
  }

  /**
   * Rotate refresh token and issue new token pair. Detects token reuse.
   */
  async refresh(rawRefreshToken: string, meta: RequestMetadata): Promise<AuthResult> {
    const incomingHash = hashToken(rawRefreshToken);
    const session = await this.sessions.findByTokenHash(incomingHash);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Token reuse detection: if a revoked session's token is presented again
    if (session.revokedAt) {
      await this.sessions.revokeAllUserSessions(
        session.userId,
        `SUSPICIOUS_TOKEN_REUSE_DETECTED: Session ${session.id}`
      );

      await this.audit.logEvent({
        userId: session.userId,
        event: AuditEventType.TOKEN_REFRESH_REUSE_DETECTED,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { reusedSessionId: session.id },
      });

      throw new UnauthorizedError('Suspicious token activity detected. All active sessions have been terminated.');
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // Check user status
    const user = await this.users.findById(session.userId);
    if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new ForbiddenError('Account is no longer active');
    }

    // Rotate refresh token
    const newRawRefreshToken = generateRandomToken(40);
    const newHash = hashToken(newRawRefreshToken);
    const newExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessions.rotateRefreshToken(session.id, newHash, newExpiry);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      sessionId: session.id,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
      companyId: user.companyId,
    });

    await this.audit.logEvent({
      userId: user.id,
      event: AuditEventType.TOKEN_REFRESH_SUCCESS,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      user: this.toSafeUser(user),
      tokens: {
        accessToken,
        refreshToken: newRawRefreshToken,
        expiresIn: 15 * 60,
      },
      sessionId: session.id,
    };
  }

  /**
   * Log out a specific session.
   */
  async logout(sessionId: string, userId: string, meta: RequestMetadata): Promise<void> {
    await this.sessions.revokeSession(sessionId, 'USER_LOGOUT');
    await this.audit.logEvent({
      userId,
      event: AuditEventType.LOGOUT,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { sessionId },
    });
  }

  /**
   * Log out all active sessions for a user.
   */
  async logoutAll(userId: string, meta: RequestMetadata): Promise<void> {
    await this.sessions.revokeAllUserSessions(userId, 'LOGOUT_ALL');
    await this.audit.logEvent({
      userId,
      event: AuditEventType.LOGOUT_ALL,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Get safe user profile for /auth/me.
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toSafeUser(user);
  }

  /**
   * Verify email via token.
   */
  async verifyEmail(rawToken: string, meta: RequestMetadata): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.tokens.findValidVerificationToken(tokenHash);

    if (!record) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await this.tokens.markVerificationTokenUsed(record.id);
    await this.users.markEmailVerified(record.userId);

    await this.audit.logEvent({
      userId: record.userId,
      event: AuditEventType.EMAIL_VERIFIED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Resend email verification token.
   */
  async resendVerification(email: string, meta: RequestMetadata): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    if (user && !user.emailVerified) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiry = new Date(
        Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
      );

      await this.tokens.createVerificationToken(user.id, tokenHash, expiry);
      await emailService.sendVerificationEmail(user.email, rawToken, user.firstName);

      await this.audit.logEvent({
        userId: user.id,
        event: AuditEventType.EMAIL_VERIFICATION_REQUESTED,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
    // Always returns silently to prevent enumeration
  }

  /**
   * Request password reset instructions.
   */
  async forgotPassword(email: string, meta: RequestMetadata): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    if (user && user.status !== UserStatus.SUSPENDED) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiry = new Date(
        Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000
      );

      await this.tokens.createResetToken(user.id, tokenHash, expiry);
      await emailService.sendPasswordResetEmail(user.email, rawToken, user.firstName);

      await this.audit.logEvent({
        userId: user.id,
        event: AuditEventType.PASSWORD_RESET_REQUESTED,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
    // Always returns silently to prevent enumeration
  }

  /**
   * Complete password reset using token and new password.
   */
  async resetPassword(input: ResetPasswordInput, meta: RequestMetadata): Promise<void> {
    const tokenHash = hashToken(input.token);
    const record = await this.tokens.findValidResetToken(tokenHash);

    if (!record) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const newHash = await hashPassword(input.newPassword);
    await this.users.updatePassword(record.userId, newHash);
    await this.tokens.markResetTokenUsed(record.id);

    // Revoke all existing sessions for security
    await this.sessions.revokeAllUserSessions(record.userId, 'PASSWORD_RESET_REVOCATION');

    await this.audit.logEvent({
      userId: record.userId,
      event: AuditEventType.PASSWORD_RESET_COMPLETED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await this.audit.logEvent({
      userId: record.userId,
      event: AuditEventType.PASSWORD_CHANGED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Get all active sessions for current user.
   */
  async getUserSessions(userId: string, currentSessionId: string) {
    const activeSessions = await this.sessions.findActiveByUserId(userId);
    return activeSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  /**
   * Revoke a specific session for current user.
   */
  async revokeUserSession(
    userId: string,
    targetSessionId: string,
    meta: RequestMetadata
  ): Promise<void> {
    const session = await this.sessions.findById(targetSessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('You are not authorized to revoke this session');
    }

    await this.sessions.revokeSession(targetSessionId, 'USER_MANUAL_REVOCATION');

    await this.audit.logEvent({
      userId,
      event: AuditEventType.SESSION_REVOKED,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { revokedSessionId: targetSessionId },
    });
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role as unknown as UserRole,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
      companyId: user.companyId,
    };
  }
}

export const authService = new AuthService();
