import { ApiResponse, ApiErrorResponse } from '@campus-os/shared-types';
import { mobileConfig } from '../constants/config';

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
}

export class MobileApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = mobileConfig.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setToken(token: string | null): void {
    this.token = token;
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

    return url;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeoutMs = mobileConfig.defaultTimeoutMs, params, headers } = options;
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
}

export const mobileApi = new MobileApiClient();
