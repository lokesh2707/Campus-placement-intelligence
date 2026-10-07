import { UserRole } from './roles.js';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserDTO extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  collegeId?: string | null;
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
