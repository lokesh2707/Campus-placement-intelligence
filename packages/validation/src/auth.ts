import { z } from 'zod';
import { UserRole } from '@campus-os/shared-types';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Must be a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const registerUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(UserRole),
  collegeId: z.string().uuid().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
