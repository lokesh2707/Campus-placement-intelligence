import { Router } from 'express';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@campus-os/validation';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';

export const authRouter = Router();

// Public Authentication Flow
authRouter.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);

// Protected Session Management
authRouter.post('/logout', requireAuth, authController.logout);
authRouter.post('/logout-all', requireAuth, authController.logoutAll);
authRouter.get('/me', requireAuth, authController.me);

// Email Verification
authRouter.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);
authRouter.post(
  '/resend-verification',
  authRateLimiter,
  validateBody(resendVerificationSchema),
  authController.resendVerification
);

// Password Reset Flow
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// User Active Sessions
authRouter.get('/sessions', requireAuth, authController.getSessions);
authRouter.delete('/sessions/:sessionId', requireAuth, authController.revokeSession);
