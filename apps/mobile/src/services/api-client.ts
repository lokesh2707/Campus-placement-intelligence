import { ApiResponse, ApiErrorResponse, UserRole } from '@campus-os/shared-types';
import { LoginInput, RegisterInput } from '@campus-os/validation';
import { mobileConfig } from '../constants/config';
import { secureStorage } from './storage';

export class MobileApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: any[]
  ) {
    super(message);
    this.name = 'MobileApiError';
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
}

export interface MobileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: Date | string | null;
}

export class MobileApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshTokenVal: string | null = null;
  private isRefreshing = false;

  constructor(baseUrl: string = mobileConfig.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async loadStoredTokens(): Promise<string | null> {
    const accessToken = await secureStorage.getItem('mobile_access_token');
    const refreshToken = await secureStorage.getItem('mobile_refresh_token');
    this.token = accessToken;
    this.refreshTokenVal = refreshToken;
    return accessToken;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async setTokens(tokens: { accessToken: string; refreshToken: string } | null): Promise<void> {
    if (tokens) {
      this.token = tokens.accessToken;
      this.refreshTokenVal = tokens.refreshToken;
      await secureStorage.setItem('mobile_access_token', tokens.accessToken);
      await secureStorage.setItem('mobile_refresh_token', tokens.refreshToken);
    } else {
      this.token = null;
      this.refreshTokenVal = null;
      await secureStorage.removeItem('mobile_access_token');
      await secureStorage.removeItem('mobile_refresh_token');
    }
  }

  getAccessToken(): string | null {
    return this.token;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl}${cleanPath}`;

    if (params) {
      const queryParams = Object.entries(params)
        .filter(([_, val]) => val !== undefined && val !== null)
        .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`)
        .join('&');

      if (queryParams) {
        url += (url.includes('?') ? '&' : '?') + queryParams;
      }
    }

    return url.toString();
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeoutMs = mobileConfig.defaultTimeoutMs, params, headers, skipAuthRefresh } = options;
    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    if (this.token) {
      reqHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle 401 Unauthorized by attempting a token refresh
      if (response.status === 401 && !skipAuthRefresh && this.refreshTokenVal && !this.isRefreshing) {
        try {
          this.isRefreshing = true;
          const refreshRes = await this.refreshToken();
          if (refreshRes.success && refreshRes.data) {
            await this.setTokens(refreshRes.data.tokens);
            this.isRefreshing = false;
            return await this.request<T>(method, path, body, { ...options, skipAuthRefresh: true });
          }
        } catch {
          await this.setTokens(null);
        } finally {
          this.isRefreshing = false;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const err = data as ApiErrorResponse;
        throw new MobileApiError(
          response.status,
          err.error?.code || 'HTTP_ERROR',
          err.error?.message || `Request failed with status ${response.status}`,
          err.error?.requestId,
          err.error?.details
        );
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      clearTimeout(timer);

      if (err instanceof MobileApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new MobileApiError(408, 'REQUEST_TIMEOUT', `Request timed out after ${timeoutMs}ms`);
      }

      throw new MobileApiError(0, 'NETWORK_ERROR', err.message || 'Network connection failed');
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  patch<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  // --- Auth API calls ---

  async register(data: RegisterInput) {
    const res = await this.post<{ user: MobileUser; tokens: { accessToken: string; refreshToken: string } }>('/api/v1/auth/register', data);
    if (res.data?.tokens) {
      await this.setTokens(res.data.tokens);
    }
    return res;
  }

  async login(credentials: LoginInput) {
    const res = await this.post<{ user: MobileUser; tokens: { accessToken: string; refreshToken: string } }>('/api/v1/auth/login', credentials);
    if (res.data?.tokens) {
      await this.setTokens(res.data.tokens);
    }
    return res;
  }

  async refreshToken() {
    return this.post<{ user: MobileUser; tokens: { accessToken: string; refreshToken: string } }>(
      '/api/v1/auth/refresh',
      { refreshToken: this.refreshTokenVal },
      { skipAuthRefresh: true }
    );
  }

  async logout() {
    try {
      await this.post('/api/v1/auth/logout', {});
    } finally {
      await this.setTokens(null);
    }
  }

  async getMe() {
    return this.get<{ user: MobileUser }>('/api/v1/auth/me');
  }
}

export const mobileApi = new MobileApiClient();
