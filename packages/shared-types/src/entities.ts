import { UserRole } from './roles.js';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserDTO extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // computed helper for backward compatibility
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  isActive?: boolean; // backward compatibility alias
  lastLoginAt?: Date | string | null;
  deletedAt?: Date | string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export interface SessionDTO {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  lastUsedAt: Date | string;
  expiresAt: Date | string;
  isCurrent?: boolean;
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_REQUESTED = 'EMAIL_VERIFICATION_REQUESTED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  TOKEN_REFRESH_SUCCESS = 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_REUSE_DETECTED = 'TOKEN_REFRESH_REUSE_DETECTED',
  USER_REGISTERED = 'USER_REGISTERED',
}

export interface AuditLogDTO {
  id: string;
  userId?: string | null;
  event: AuditEventType;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  timestamp: Date | string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'unknown';
      latencyMs?: number;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'optional_disabled';
      latencyMs?: number;
    };
    mlService: {
      status: 'available' | 'unavailable' | 'unknown';
      provider: string;
    };
  };
}

export interface StorageUploadResult {
  fileKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface AIProviderStatus {
  providerName: string;
  isAvailable: boolean;
  defaultModel: string;
  isLocal: boolean;
}
