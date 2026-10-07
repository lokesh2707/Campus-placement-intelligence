import { Request, Response, NextFunction } from 'express';
import { UserRole, TokenPayload } from '@campus-os/shared-types';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid format');
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    sendError(res, 401, 'INVALID_TOKEN', 'Access token has expired or is invalid');
    return;
  }

  req.user = payload;
  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Role '${req.user.role}' is not authorized to access this resource`
      );
      return;
    }

    next();
  };
}
