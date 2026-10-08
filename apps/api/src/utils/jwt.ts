import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload, UserRole } from '@campus-os/shared-types';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '@campus-os/config';
import { env } from '../config/env.js';

export function signAccessToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}): string {
  const tokenPayload: TokenPayload = {
    sub: payload.userId,
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    collegeId: payload.collegeId,
    departmentId: payload.departmentId,
    companyId: payload.companyId,
  };

  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY as any,
  };
  return jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: { userId: string; sessionId: string }): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    if (!decoded || (!decoded.sub && !decoded.userId)) {
      return null;
    }
    return {
      sub: decoded.sub || decoded.userId,
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId || '',
      collegeId: decoded.collegeId,
      departmentId: decoded.departmentId,
      companyId: decoded.companyId,
    };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; sessionId?: string } | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; sessionId?: string };
  } catch {
    return null;
  }
}
