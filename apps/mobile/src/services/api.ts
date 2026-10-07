import { ApiResponse, SystemHealthStatus } from '@campus-os/shared-types';
import { API_PREFIX } from '@campus-os/config';

// Defaults to standard Android emulator loopback or localhost
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://10.0.2.2:4000${API_PREFIX}`;

export class MobileApiClient {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  static async getHealth(): Promise<ApiResponse<SystemHealthStatus>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API health check failed with status ${response.status}`);
    }

    return response.json();
  }
}
