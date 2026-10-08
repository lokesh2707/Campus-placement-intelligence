import { describe, it, expect } from 'vitest';
import { generateRandomToken, hashToken, verifyTokenHash } from '../src/utils/crypto.js';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';
import { UserRole } from '@campus-os/shared-types';

describe('Token Generation & Crypto Architecture', () => {
  it('generates cryptographically secure random hexadecimal tokens', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).toHaveLength(64); // 32 bytes in hex = 64 characters
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('computes and verifies SHA-256 token hashes in constant time', () => {
    const token = generateRandomToken(40);
    const hash = hashToken(token);

    expect(hash).toHaveLength(64);
    expect(verifyTokenHash(token, hash)).toBe(true);
    expect(verifyTokenHash('tampered-token-value', hash)).toBe(false);
  });

  it('signs and verifies JWT access tokens with sub, role, and sessionId', () => {
    const payload = {
      userId: 'user-uuid-12345',
      email: 'student@campus.edu',
      role: UserRole.STUDENT,
      sessionId: 'session-uuid-67890',
      collegeId: 'college-uuid-999',
    };

    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(payload.userId);
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(UserRole.STUDENT);
    expect(decoded?.sessionId).toBe(payload.sessionId);
    expect(decoded?.collegeId).toBe(payload.collegeId);
  });

  it('rejects tampered and invalid JWT tokens', () => {
    const validToken = signAccessToken({
      userId: 'test-user',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      sessionId: 'session-1',
    });

    const tamperedToken = validToken.slice(0, -6) + 'abcdef';
    expect(verifyAccessToken(tamperedToken)).toBeNull();
    expect(verifyAccessToken('completely.invalid.token')).toBeNull();
  });
});
