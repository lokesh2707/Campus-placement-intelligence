import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '@campus-os/shared-types';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '@campus-os/config';
import { env } from '../config/env.js';

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: { userId: string }): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
