import { z } from 'zod';
import { UserRole } from '@campus-os/shared-types';

export const passwordValidation = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must not exceed 128 characters' });

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Must be a valid email address' }),
  password: passwordValidation,
  firstName: z.string().trim().min(1, { message: 'First name is required' }).max(50),
  lastName: z.string().trim().min(1, { message: 'Last name is required' }).max(50),
  phone: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  collegeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Backward-compatible alias
export const registerUserSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Must be a valid email address' }),
  password: passwordValidation,
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  collegeId: z.string().uuid().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Must be a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, { message: 'Verification token is required' }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Must be a valid email address' }),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Must be a valid email address' }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, { message: 'Reset token is required' }),
  newPassword: passwordValidation,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
