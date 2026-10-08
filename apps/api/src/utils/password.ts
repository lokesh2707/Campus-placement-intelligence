import argon2 from 'argon2';

/**
 * Hash a plaintext password using Argon2id with memory-hardened parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,         // 3 iterations
    parallelism: 1,      // 1 thread
  });
}

/**
 * Verify a plaintext password against an Argon2id hash in constant time.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
