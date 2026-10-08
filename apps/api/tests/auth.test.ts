import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';
import { UserRole } from '@campus-os/shared-types';
import { hasPermission } from '@campus-os/config';

describe('Auth & Permission Architecture', () => {
  it('signs and verifies JWT access token', () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'student@campus.edu',
      role: UserRole.STUDENT,
      sessionId: 'test-session-12345',
    };

    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.role).toBe(UserRole.STUDENT);
  });

  it('correctly validates role permissions based on role matrix', () => {
    expect(hasPermission(UserRole.SUPER_ADMIN, 'system:manage')).toBe(true);
    expect(hasPermission(UserRole.STUDENT, 'system:manage')).toBe(false);
    expect(hasPermission(UserRole.STUDENT, 'applications:submit')).toBe(true);
    expect(hasPermission(UserRole.RECRUITER, 'offers:issue')).toBe(true);
  });
});
