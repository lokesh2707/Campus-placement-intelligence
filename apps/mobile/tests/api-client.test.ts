import { describe, it, expect } from 'vitest';
import { MobileApiClient, MobileApiError } from '../src/services/api-client';

describe('Mobile MobileApiClient Architecture', () => {
  it('instantiates MobileApiClient with custom base URL and token', () => {
    const client = new MobileApiClient('http://localhost:4000/api/v1');
    expect(client).toBeDefined();
    client.setToken('sample-jwt-token');
  });

  it('instantiates MobileApiError with status code, code, and message', () => {
    const error = new MobileApiError(401, 'UNAUTHORIZED', 'Session expired', 'req-999');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Session expired');
    expect(error.requestId).toBe('req-999');
  });
});
