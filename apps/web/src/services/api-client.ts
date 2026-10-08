import { ApiResponse, ApiErrorResponse, UserRole } from '@campus-os/shared-types';
import {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@campus-os/validation';
import { webConfig } from '../config/env';

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: any[]
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: Date | string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshTokenVal: string | null = null;
  private isRefreshing = false;

  constructor(baseUrl: string = webConfig.apiUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');

    // Restore from storage if in browser
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem('campus_access_token');
        this.refreshTokenVal = localStorage.getItem('campus_refresh_token');
      } catch {
        // LocalStorage access restricted
      }
    }
  }

  setAuthToken(token: string | null): void {
    this.token = token;
  }

  setTokens(tokens: { accessToken: string; refreshToken: string } | null): void {
    if (tokens) {
      this.token = tokens.accessToken;
      this.refreshTokenVal = tokens.refreshToken;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('campus_access_token', tokens.accessToken);
          localStorage.setItem('campus_refresh_token', tokens.refreshToken);
        } catch {}
      }
    } else {
      this.token = null;
      this.refreshTokenVal = null;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('campus_access_token');
          localStorage.removeItem('campus_refresh_token');
        } catch {}
      }
    }
  }

  getAccessToken(): string | null {
    return this.token;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { timeoutMs = webConfig.defaultTimeoutMs, params, headers, skipAuthRefresh, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    const reqHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(headers as Record<string, string>),
    };

    if (this.token) {
      reqHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers: reqHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle 401 Unauthorized with token refresh (once)
      if (response.status === 401 && !skipAuthRefresh && this.refreshTokenVal && !this.isRefreshing) {
        try {
          this.isRefreshing = true;
          const refreshResult = await this.refreshToken();
          if (refreshResult.success && refreshResult.data) {
            this.setTokens(refreshResult.data.tokens);
            this.isRefreshing = false;
            // Retry initial request with new token
            return await this.request<T>(path, { ...options, skipAuthRefresh: true });
          }
        } catch {
          this.setTokens(null);
        } finally {
          this.isRefreshing = false;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        throw new ApiClientError(
          response.status,
          errorData.error?.code || 'HTTP_ERROR',
          errorData.error?.message || `Request failed with status ${response.status}`,
          errorData.error?.requestId,
          errorData.error?.details
        );
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      clearTimeout(timer);

      if (err instanceof ApiClientError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiClientError(408, 'REQUEST_TIMEOUT', `Request timed out after ${timeoutMs}ms`);
      }

      throw new ApiClientError(0, 'NETWORK_ERROR', err.message || 'Network request failed');
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  // --- Auth Service Specific Methods ---

  async register(data: RegisterInput) {
    const res = await this.post<{ user: AuthUser; tokens: AuthTokens; sessionId: string }>('/api/v1/auth/register', data);
    if (res.data?.tokens) {
      this.setTokens(res.data.tokens);
    }
    return res;
  }

  async login(credentials: LoginInput) {
    const res = await this.post<{ user: AuthUser; tokens: AuthTokens; sessionId: string }>('/api/v1/auth/login', credentials);
    if (res.data?.tokens) {
      this.setTokens(res.data.tokens);
    }
    return res;
  }

  async refreshToken() {
    const body = this.refreshTokenVal ? { refreshToken: this.refreshTokenVal } : {};
    return this.post<{ user: AuthUser; tokens: AuthTokens; sessionId: string }>(
      '/api/v1/auth/refresh',
      body,
      { skipAuthRefresh: true }
    );
  }

  async logout() {
    try {
      await this.post('/api/v1/auth/logout', {});
    } finally {
      this.setTokens(null);
    }
  }

  async logoutAll() {
    try {
      await this.post('/api/v1/auth/logout-all', {});
    } finally {
      this.setTokens(null);
    }
  }

  async getMe() {
    return this.get<{ user: AuthUser }>('/api/v1/auth/me');
  }

  async verifyEmail(token: string) {
    return this.post('/api/v1/auth/verify-email', { token });
  }

  async resendVerification(email: string) {
    return this.post('/api/v1/auth/resend-verification', { email });
  }

  async forgotPassword(email: string) {
    return this.post('/api/v1/auth/forgot-password', { email });
  }

  async resetPassword(data: ResetPasswordInput) {
    return this.post('/api/v1/auth/reset-password', data);
  }

  async getSessions() {
    return this.get<{ sessions: any[] }>('/api/v1/auth/sessions');
  }

  async revokeSession(sessionId: string) {
    return this.delete(`/api/v1/auth/sessions/${sessionId}`);
  }

  // --- Student Domain Methods ---

  async getStudentProfile() {
    return this.get<any>('/api/v1/students/me');
  }

  async createStudentProfile(data: any) {
    return this.post<any>('/api/v1/students/profile', data);
  }

  async updateStudentProfile(data: any) {
    return this.patch<any>('/api/v1/students/me', data);
  }

  async getTaxonomySkills(category?: string) {
    return this.get<any[]>('/api/v1/skills', { params: { category } });
  }

  async addStudentSkill(data: { skillId: string; proficiency?: string; yearsOfExperience?: number }) {
    return this.post<any>('/api/v1/students/me/skills', data);
  }

  async removeStudentSkill(skillId: string) {
    return this.delete<void>(`/api/v1/students/me/skills/${skillId}`);
  }

  async getStudentProjects() {
    return this.get<any[]>('/api/v1/students/me/projects');
  }

  async addStudentProject(data: any) {
    return this.post<any>('/api/v1/students/me/projects', data);
  }

  async updateStudentProject(id: string, data: any) {
    return this.patch<any>(`/api/v1/students/me/projects/${id}`, data);
  }

  async deleteStudentProject(id: string) {
    return this.delete<void>(`/api/v1/students/me/projects/${id}`);
  }

  async getStudentInternships() {
    return this.get<any[]>('/api/v1/students/me/internships');
  }

  async addStudentInternship(data: any) {
    return this.post<any>('/api/v1/students/me/internships', data);
  }

  async deleteStudentInternship(id: string) {
    return this.delete<void>(`/api/v1/students/me/internships/${id}`);
  }

  async getStudentCertifications() {
    return this.get<any[]>('/api/v1/students/me/certifications');
  }

  async addStudentCertification(data: any) {
    return this.post<any>('/api/v1/students/me/certifications', data);
  }

  async deleteStudentCertification(id: string) {
    return this.delete<void>(`/api/v1/students/me/certifications/${id}`);
  }

  async getStudentPreferences() {
    return this.get<any>('/api/v1/students/me/preferences');
  }

  async updateStudentPreferences(data: any) {
    return this.put<any>('/api/v1/students/me/preferences', data);
  }

  async getStudentResumes() {
    return this.get<any[]>('/api/v1/students/me/resumes');
  }

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<any>('/api/v1/students/me/resumes', {
      method: 'POST',
      body: formData,
    });
  }

  async setActiveResume(resumeId: string) {
    return this.patch<any>(`/api/v1/students/me/resumes/${resumeId}/activate`);
  }

  async deleteResume(resumeId: string) {
    return this.delete<void>(`/api/v1/students/me/resumes/${resumeId}`);
  }

  // --- Academic Structure Methods ---

  async getColleges() {
    return this.get<any[]>('/api/v1/colleges');
  }

  async getDepartments(collegeId: string) {
    return this.get<any[]>('/api/v1/departments', { params: { collegeId } });
  }

  async getDegrees(departmentId: string) {
    return this.get<any[]>('/api/v1/degrees', { params: { departmentId } });
  }

  async getBatches(degreeId: string) {
    return this.get<any[]>('/api/v1/batches', { params: { degreeId } });
  }

  // --- Admin Student Management Methods ---

  async getAdminStudents(params: any = {}) {
    return this.get<any[]>('/api/v1/admin/students', { params });
  }

  async getAdminStudentById(id: string) {
    return this.get<any>(`/api/v1/admin/students/${id}`);
  }

  async updateAdminStudent(id: string, data: any) {
    return this.patch<any>(`/api/v1/admin/students/${id}`, data);
  }

  async verifyAdminStudent(id: string, status: string, notes?: string) {
    return this.post<any>(`/api/v1/admin/students/${id}/verify`, { status, notes });
  }
}

export const apiClient = new ApiClient();
