export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLACEMENT_ADMIN = 'PLACEMENT_ADMIN',
  PLACEMENT_COORDINATOR = 'PLACEMENT_COORDINATOR',
  DEPARTMENT_COORDINATOR = 'DEPARTMENT_COORDINATOR',
  RECRUITER = 'RECRUITER',
  STUDENT = 'STUDENT',
}

export type RoleName = keyof typeof UserRole;

export interface TokenPayload {
  sub: string;
  userId: string; // Alias for backward compatibility
  email: string;
  role: UserRole;
  sessionId: string;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: UserRole;
    status: string;
    emailVerified: boolean;
    lastLoginAt?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  tokens: AuthTokens;
  sessionId: string;
}
