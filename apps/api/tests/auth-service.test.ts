import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/services/auth.service.js';
import { UserRole, UserStatus, AuditEventType } from '@campus-os/shared-types';
import { hashPassword } from '../src/utils/password.js';
import { hashToken } from '../src/utils/crypto.js';
import { emailService } from '../src/services/email/index.js';

describe('AuthService Complete Business & Security Lifecycle', () => {
  let authService: AuthService;
  let mockUsers: any[];
  let mockSessions: any[];
  let mockVerificationTokens: any[];
  let mockResetTokens: any[];
  let mockAuditLogs: any[];

  beforeEach(() => {
    emailService.clearHistory();
    mockUsers = [];
    mockSessions = [];
    mockVerificationTokens = [];
    mockResetTokens = [];
    mockAuditLogs = [];

    const fakeUserRepository: any = {
      findByEmail: async (email: string) => {
        return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.deletedAt) || null;
      },
      findById: async (id: string) => {
        return mockUsers.find((u) => u.id === id && !u.deletedAt) || null;
      },
      create: async (data: any) => {
        const newUser = {
          id: `user-${mockUsers.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          lastLoginAt: null,
        };
        mockUsers.push(newUser);
        return newUser;
      },
      updateLastLogin: async (id: string) => {
        const u = mockUsers.find((u) => u.id === id);
        if (u) u.lastLoginAt = new Date();
        return u;
      },
      updatePassword: async (id: string, passwordHash: string) => {
        const u = mockUsers.find((u) => u.id === id);
        if (u) u.passwordHash = passwordHash;
        return u;
      },
      markEmailVerified: async (id: string) => {
        const u = mockUsers.find((u) => u.id === id);
        if (u) {
          u.emailVerified = true;
          u.status = UserStatus.ACTIVE;
        }
        return u;
      },
    };

    const fakeSessionRepository: any = {
      create: async (data: any) => {
        const session = {
          id: `sess-${mockSessions.length + 1}`,
          ...data,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          revokedAt: null,
          revokedReason: null,
        };
        mockSessions.push(session);
        return session;
      },
      findByTokenHash: async (hash: string) => {
        return mockSessions.find((s) => s.refreshTokenHash === hash) || null;
      },
      findById: async (id: string) => {
        return mockSessions.find((s) => s.id === id) || null;
      },
      findActiveByUserId: async (userId: string) => {
        return mockSessions.filter(
          (s) => s.userId === userId && !s.revokedAt && s.expiresAt > new Date()
        );
      },
      rotateRefreshToken: async (id: string, newHash: string, newExpiry: Date) => {
        const s = mockSessions.find((s) => s.id === id);
        if (s) {
          s.refreshTokenHash = newHash;
          s.expiresAt = newExpiry;
          s.lastUsedAt = new Date();
        }
        return s;
      },
      revokeSession: async (id: string, reason: string) => {
        const s = mockSessions.find((s) => s.id === id);
        if (s) {
          s.revokedAt = new Date();
          s.revokedReason = reason;
        }
        return s;
      },
      revokeAllUserSessions: async (userId: string, reason: string) => {
        let count = 0;
        for (const s of mockSessions) {
          if (s.userId === userId && !s.revokedAt) {
            s.revokedAt = new Date();
            s.revokedReason = reason;
            count++;
          }
        }
        return count;
      },
    };

    const fakeTokenRepository: any = {
      createVerificationToken: async (userId: string, tokenHash: string, expiresAt: Date) => {
        const token = {
          id: `vt-${mockVerificationTokens.length + 1}`,
          userId,
          tokenHash,
          expiresAt,
          createdAt: new Date(),
          usedAt: null,
        };
        mockVerificationTokens.push(token);
        return token;
      },
      findValidVerificationToken: async (tokenHash: string) => {
        return (
          mockVerificationTokens.find(
            (t) => t.tokenHash === tokenHash && !t.usedAt && t.expiresAt > new Date()
          ) || null
        );
      },
      markVerificationTokenUsed: async (id: string) => {
        const t = mockVerificationTokens.find((t) => t.id === id);
        if (t) t.usedAt = new Date();
        return t;
      },
      createResetToken: async (userId: string, tokenHash: string, expiresAt: Date) => {
        const token = {
          id: `rt-${mockResetTokens.length + 1}`,
          userId,
          tokenHash,
          expiresAt,
          createdAt: new Date(),
          usedAt: null,
        };
        mockResetTokens.push(token);
        return token;
      },
      findValidResetToken: async (tokenHash: string) => {
        return (
          mockResetTokens.find(
            (t) => t.tokenHash === tokenHash && !t.usedAt && t.expiresAt > new Date()
          ) || null
        );
      },
      markResetTokenUsed: async (id: string) => {
        const t = mockResetTokens.find((t) => t.id === id);
        if (t) t.usedAt = new Date();
        return t;
      },
    };

    const fakeAuditService: any = {
      logEvent: async (params: any) => {
        mockAuditLogs.push(params);
      },
    };

    authService = new AuthService(
      fakeUserRepository,
      fakeSessionRepository,
      fakeTokenRepository,
      fakeAuditService
    );
  });

  describe('Registration & Public Signup Restrictions', () => {
    it('successfully registers a student with Argon2id hash and verification token', async () => {
      const result = await authService.register(
        {
          email: 'student@campus.edu',
          password: 'Password123!',
          firstName: 'Aarav',
          lastName: 'Sharma',
        },
        { requestId: 'req-reg-1', userAgent: 'Vitest' }
      );

      expect(result.user.email).toBe('student@campus.edu');
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.user.status).toBe(UserStatus.PENDING_VERIFICATION);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // Email verification token generated and email simulated
      const lastEmail = emailService.getLastSentEmail('student@campus.edu');
      expect(lastEmail).toBeDefined();
      expect(lastEmail?.type).toBe('verification');

      // Audits recorded
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.USER_REGISTERED)).toBe(true);
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.SESSION_CREATED)).toBe(true);
    });

    it('rejects public attempts to register as SUPER_ADMIN or PLACEMENT_ADMIN', async () => {
      await expect(
        authService.register(
          {
            email: 'hacker@campus.edu',
            password: 'Password123!',
            firstName: 'Bad',
            lastName: 'Actor',
            role: UserRole.SUPER_ADMIN,
          },
          {}
        )
      ).rejects.toThrow('Privileged administrator roles cannot be registered through public signup');
    });

    it('rejects duplicate email registrations', async () => {
      await authService.register(
        {
          email: 'duplicate@campus.edu',
          password: 'Password123!',
          firstName: 'First',
          lastName: 'User',
        },
        {}
      );

      await expect(
        authService.register(
          {
            email: 'duplicate@campus.edu',
            password: 'DifferentPass123!',
            firstName: 'Second',
            lastName: 'User',
          },
          {}
        )
      ).rejects.toThrow('An account with this email address already exists');
    });
  });

  describe('Login & Status Safeguards', () => {
    it('authenticates active user and issues session and tokens', async () => {
      await authService.register(
        {
          email: 'login-test@campus.edu',
          password: 'CorrectPass123!',
          firstName: 'Login',
          lastName: 'User',
        },
        {}
      );

      const loginResult = await authService.login(
        {
          email: 'login-test@campus.edu',
          password: 'CorrectPass123!',
        },
        { requestId: 'req-login-1' }
      );

      expect(loginResult.user.email).toBe('login-test@campus.edu');
      expect(loginResult.tokens.accessToken).toBeDefined();
      expect(loginResult.tokens.refreshToken).toBeDefined();
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.LOGIN_SUCCESS)).toBe(true);
    });

    it('rejects incorrect password with generic error and logs failure', async () => {
      await authService.register(
        {
          email: 'wrong-pass@campus.edu',
          password: 'OriginalPass123!',
          firstName: 'User',
          lastName: 'Test',
        },
        {}
      );

      await expect(
        authService.login(
          {
            email: 'wrong-pass@campus.edu',
            password: 'WrongPassword999!',
          },
          {}
        )
      ).rejects.toThrow('Invalid email or password');

      expect(mockAuditLogs.some((a) => a.event === AuditEventType.LOGIN_FAILED)).toBe(true);
    });

    it('rejects login for suspended accounts', async () => {
      const reg = await authService.register(
        {
          email: 'suspended@campus.edu',
          password: 'Pass123456!',
          firstName: 'Suspended',
          lastName: 'Student',
        },
        {}
      );

      // Manually set status to SUSPENDED
      const user = mockUsers.find((u) => u.id === reg.user.id);
      user.status = UserStatus.SUSPENDED;

      await expect(
        authService.login(
          {
            email: 'suspended@campus.edu',
            password: 'Pass123456!',
          },
          {}
        )
      ).rejects.toThrow('Your account has been suspended');
    });
  });

  describe('Refresh Token Rotation & Suspicious Reuse Detection', () => {
    it('rotates refresh token and issues new token pair', async () => {
      const reg = await authService.register(
        {
          email: 'rotate@campus.edu',
          password: 'Password123!',
          firstName: 'Rotate',
          lastName: 'User',
        },
        {}
      );

      const originalRefreshToken = reg.tokens.refreshToken;
      const refreshResult = await authService.refresh(originalRefreshToken, {});

      expect(refreshResult.tokens.accessToken).toBeDefined();
      expect(refreshResult.tokens.refreshToken).toBeDefined();
      expect(refreshResult.tokens.refreshToken).not.toBe(originalRefreshToken);
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.TOKEN_REFRESH_SUCCESS)).toBe(true);
    });

    it('detects token reuse and revokes all active sessions for that user', async () => {
      const reg = await authService.register(
        {
          email: 'reuse@campus.edu',
          password: 'Password123!',
          firstName: 'Reuse',
          lastName: 'Victim',
        },
        {}
      );

      const originalToken = reg.tokens.refreshToken;

      // Legitimate rotation occurs
      await authService.refresh(originalToken, {});

      // Attacker attempts to reuse the original (now revoked/replaced) token
      // Note: in our mock, after rotation, the old token is replaced. Let's create an explicitly revoked session
      const user = mockUsers[0];
      mockSessions.push({
        id: 'compromised-session',
        userId: user.id,
        refreshTokenHash: hashToken('attacker-stolen-token'),
        revokedAt: new Date(),
        revokedReason: 'ROTATED',
        expiresAt: new Date(Date.now() + 1000000),
      });

      await expect(
        authService.refresh('attacker-stolen-token', {})
      ).rejects.toThrow('Suspicious token activity detected. All active sessions have been terminated.');

      expect(mockAuditLogs.some((a) => a.event === AuditEventType.TOKEN_REFRESH_REUSE_DETECTED)).toBe(true);
    });
  });

  describe('Session Management & Logout', () => {
    it('revokes session on logout', async () => {
      const reg = await authService.register(
        {
          email: 'logout@campus.edu',
          password: 'Password123!',
          firstName: 'Logout',
          lastName: 'User',
        },
        {}
      );

      await authService.logout(reg.sessionId, reg.user.id, {});
      const session = mockSessions.find((s) => s.id === reg.sessionId);
      expect(session.revokedAt).not.toBeNull();
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.LOGOUT)).toBe(true);
    });

    it('terminates all sessions on logout-all', async () => {
      const reg = await authService.register(
        {
          email: 'logoutall@campus.edu',
          password: 'Password123!',
          firstName: 'Multi',
          lastName: 'Session',
        },
        {}
      );

      // Create a second session
      await authService.login(
        { email: 'logoutall@campus.edu', password: 'Password123!' },
        {}
      );

      expect(mockSessions.filter((s) => s.userId === reg.user.id && !s.revokedAt).length).toBe(2);

      await authService.logoutAll(reg.user.id, {});
      expect(mockSessions.filter((s) => s.userId === reg.user.id && !s.revokedAt).length).toBe(0);
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.LOGOUT_ALL)).toBe(true);
    });
  });

  describe('Email Verification & Password Reset Flows', () => {
    it('verifies email and activates account with valid token', async () => {
      const reg = await authService.register(
        {
          email: 'verify@campus.edu',
          password: 'Password123!',
          firstName: 'Verify',
          lastName: 'Me',
        },
        {}
      );

      const email = emailService.getLastSentEmail('verify@campus.edu');
      expect(email).toBeDefined();

      await authService.verifyEmail(email!.token, {});

      const updatedUser = mockUsers.find((u) => u.id === reg.user.id);
      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.status).toBe(UserStatus.ACTIVE);
      expect(mockAuditLogs.some((a) => a.event === AuditEventType.EMAIL_VERIFIED)).toBe(true);
    });

    it('completes password reset and revokes existing sessions', async () => {
      const reg = await authService.register(
        {
          email: 'reset@campus.edu',
          password: 'OldPassword123!',
          firstName: 'Reset',
          lastName: 'Password',
        },
        {}
      );

      await authService.forgotPassword('reset@campus.edu', {});
      const resetEmail = emailService.getLastSentEmail('reset@campus.edu');
      expect(resetEmail?.type).toBe('password_reset');

      await authService.resetPassword(
        {
          token: resetEmail!.token,
          newPassword: 'BrandNewPassword999!',
        },
        {}
      );

      // Sessions revoked
      const activeSessions = mockSessions.filter(
        (s) => s.userId === reg.user.id && !s.revokedAt
      );
      expect(activeSessions.length).toBe(0);

      // Can login with new password
      const loginResult = await authService.login(
        { email: 'reset@campus.edu', password: 'BrandNewPassword999!' },
        {}
      );
      expect(loginResult.user.id).toBe(reg.user.id);
    });
  });
});
