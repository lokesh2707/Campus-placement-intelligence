import { describe, it, expect } from 'vitest';
import { MobileApiClient } from '../src/services/api-client';
import { secureStorage } from '../src/services/storage';

describe('Mobile Authentication & Secure Storage', () => {
  it('stores and retrieves tokens via secure storage adapter', async () => {
    await secureStorage.setItem('test_token_key', 'secret-refresh-value');
    const retrieved = await secureStorage.getItem('test_token_key');
    expect(retrieved).toBe('secret-refresh-value');

    await secureStorage.removeItem('test_token_key');
    const afterRemoval = await secureStorage.getItem('test_token_key');
    expect(afterRemoval).toBeNull();
  });

  it('manages tokens and exposes auth methods in MobileApiClient', async () => {
    const client = new MobileApiClient('http://localhost:4000/api/v1');
    expect(client.getAccessToken()).toBeNull();

    await client.setTokens({
      accessToken: 'mobile-jwt-access',
      refreshToken: 'mobile-refresh-token',
    });
    expect(client.getAccessToken()).toBe('mobile-jwt-access');

    await client.setTokens(null);
    expect(client.getAccessToken()).toBeNull();

    expect(typeof client.login).toBe('function');
    expect(typeof client.register).toBe('function');
    expect(typeof client.refreshToken).toBe('function');
    expect(typeof client.logout).toBe('function');
    expect(typeof client.getMe).toBe('function');
  });
});
