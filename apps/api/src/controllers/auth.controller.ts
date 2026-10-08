import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, REFRESH_TOKEN_EXPIRY_DAYS } from '@campus-os/config';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { BadRequestError } from '../errors/app-error.js';

export class AuthController {
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      const result = await authService.register(req.body, meta);
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          tokens: result.tokens,
          sessionId: result.sessionId,
        },
        201,
        'User registered successfully',
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      const result = await authService.login(req.body, meta);
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          tokens: result.tokens,
          sessionId: result.sessionId,
        },
        200,
        'Login successful',
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.body?.refreshToken || req.cookies?.[AUTH_COOKIE_NAME];

      if (!token) {
        throw new BadRequestError('Refresh token must be provided via request body or secure cookie');
      }

      const meta = {
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      const result = await authService.refresh(token, meta);
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          tokens: result.tokens,
          sessionId: result.sessionId,
        },
        200,
        'Token refreshed successfully',
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.sessionId || !req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
        return;
      }

      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.logout(req.sessionId, req.user.userId || req.user.sub, meta);
      this.clearRefreshTokenCookie(res);

      sendSuccess(res, { message: 'Logged out successfully' }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
        return;
      }

      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.logoutAll(req.user.userId || req.user.sub, meta);
      this.clearRefreshTokenCookie(res);

      sendSuccess(res, { message: 'All active sessions terminated successfully' }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
        return;
      }

      const user = await authService.getCurrentUser(req.user.userId || req.user.sub);
      sendSuccess(res, { user }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.verifyEmail(req.body.token, meta);
      sendSuccess(res, { message: 'Email address successfully verified' }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.resendVerification(req.body.email, meta);
      sendSuccess(
        res,
        { message: 'If an unverified account exists for this email, verification instructions have been resent.' },
        200,
        undefined,
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.forgotPassword(req.body.email, meta);
      sendSuccess(
        res,
        { message: 'If an account exists for this email, password reset instructions have been generated.' },
        200,
        undefined,
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.resetPassword(req.body, meta);
      this.clearRefreshTokenCookie(res);

      sendSuccess(
        res,
        { message: 'Password has been reset successfully. Please log in with your new credentials.' },
        200,
        undefined,
        undefined,
        req.id
      );
    } catch (error) {
      next(error);
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.sessionId) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
        return;
      }

      const sessions = await authService.getUserSessions(req.user.userId || req.user.sub, req.sessionId);
      sendSuccess(res, { sessions }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req.id);
        return;
      }

      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      };

      await authService.revokeUserSession(req.user.userId || req.user.sub, req.params.sessionId as string, meta);
      sendSuccess(res, { message: 'Session revoked successfully' }, 200, undefined, undefined, req.id);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
