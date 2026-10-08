import crypto from 'node:crypto';

/**
 * Generate a cryptographically secure random hexadecimal string.
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Compute SHA-256 hash of a string/token for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison between a token hash and stored hash.
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const computedHash = hashToken(token);
  if (computedHash.length !== storedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
}
