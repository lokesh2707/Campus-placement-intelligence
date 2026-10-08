import { Request, Response, NextFunction } from 'express';
import { UserRole, TokenPayload } from '@campus-os/shared-types';
import { Permission, hasPermission } from '@campus-os/config';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { userRepository } from '../repositories/user.repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      sessionId?: string;
    }
  }
}

/**
 * Middleware that authenticates incoming requests via JWT Bearer token or authorization header.
 * Verifies that the access token is valid, user is active, and session is not revoked.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.campus_access_token) {
    token = req.cookies.campus_access_token;
  }

  if (!token) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid format', undefined, req.id);
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    sendError(res, 401, 'INVALID_TOKEN', 'Access token has expired or is invalid', undefined, req.id);
    return;
  }

  // Validate session active state in database if sessionId is present
  if (payload.sessionId) {
    const session = await sessionRepository.findById(payload.sessionId);
    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      sendError(res, 401, 'SESSION_REVOKED', 'Session has been revoked or expired', undefined, req.id);
      return;
    }
  }

  // Verify user is not suspended or soft deleted
  const user = await userRepository.findById(payload.userId || payload.sub);
  if (!user || user.deletedAt) {
    sendError(res, 401, 'USER_NOT_FOUND', 'User account does not exist or has been deleted', undefined, req.id);
    return;
  }

  if (user.status === 'SUSPENDED') {
    sendError(res, 403, 'ACCOUNT_SUSPENDED', 'User account has been suspended', undefined, req.id);
    return;
  }

  req.user = payload;
  req.sessionId = payload.sessionId;
  next();
}

/**
 * Backward-compatible alias for requireAuth.
 */
export const authenticate = requireAuth;

/**
 * Middleware that restricts access to users with one of the specified roles.
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Role '${req.user.role}' is not authorized to access this resource`,
        undefined,
        req.id
      );
      return;
    }

    next();
  };
}

/**
 * Middleware that enforces granular permissions based on the role permission matrix.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Permission '${permission}' required for this action`,
        undefined,
        req.id
      );
      return;
    }

    next();
  };
}

/**
 * Object-level authorization helper: validates whether the requesting user
 * owns the resource or has institution-level administrator privileges.
 */
export function canAccessResource(user: TokenPayload, resourceOwnerId: string): boolean {
  if (
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.PLACEMENT_ADMIN
  ) {
    return true;
  }

  const userId = user.userId || user.sub;
  return userId === resourceOwnerId;
}
