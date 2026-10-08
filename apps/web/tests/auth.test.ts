import { describe, it, expect } from 'vitest';
import { ApiClient } from '../src/services/api-client';

describe('Web ApiClient Auth Functionality', () => {
  it('correctly sets and clears auth tokens in ApiClient', () => {
    const client = new ApiClient('http://localhost:4000');
    expect(client.getAccessToken()).toBeNull();

    client.setTokens({
      accessToken: 'access-jwt-123',
      refreshToken: 'refresh-random-456',
    });
    expect(client.getAccessToken()).toBe('access-jwt-123');

    client.setTokens(null);
    expect(client.getAccessToken()).toBeNull();
  });

  it('exposes authentication methods (login, register, refreshToken, logout, getMe)', () => {
    const client = new ApiClient('http://localhost:4000');
    expect(typeof client.login).toBe('function');
    expect(typeof client.register).toBe('function');
    expect(typeof client.refreshToken).toBe('function');
    expect(typeof client.logout).toBe('function');
    expect(typeof client.getMe).toBe('function');
    expect(typeof client.verifyEmail).toBe('function');
    expect(typeof client.resetPassword).toBe('function');
  });
});
