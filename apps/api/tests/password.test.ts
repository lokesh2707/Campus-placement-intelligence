import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Password Security (Argon2id)', () => {
  it('hashes and successfully verifies a plaintext password', async () => {
    const plaintext = 'SecurePass123!';
    const hash = await hashPassword(plaintext);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
    expect(hash).not.toBe(plaintext);

    const isValid = await verifyPassword(plaintext, hash);
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect plaintext password', async () => {
    const hash = await hashPassword('CorrectPassword123');
    const isValid = await verifyPassword('WrongPassword999', hash);
    expect(isValid).toBe(false);
  });

  it('generates distinct salt-hardened hashes for identical passwords', async () => {
    const plaintext = 'IdenticalPassword123';
    const hashA = await hashPassword(plaintext);
    const hashB = await hashPassword(plaintext);

    expect(hashA).not.toBe(hashB);
    expect(await verifyPassword(plaintext, hashA)).toBe(true);
    expect(await verifyPassword(plaintext, hashB)).toBe(true);
  });
});
