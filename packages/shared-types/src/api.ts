export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  requestId?: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: ApiError;
  timestamp: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  version: string;
}

export interface ServiceReadiness {
  status: 'ready' | 'not_ready';
  service: string;
  timestamp: string;
  checks: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'disabled';
      latencyMs?: number;
    };
    mlService: {
      status: 'available' | 'unavailable';
      service?: string;
      latencyMs?: number;
    };
  };
}
