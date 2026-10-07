import { describe, it, expect } from 'vitest';
import { ApiClient, ApiClientError } from '../src/services/api-client';

describe('Web ApiClient Architecture', () => {
  it('instantiates ApiClient with custom baseUrl and token management', () => {
    const client = new ApiClient('http://localhost:4000/api/v1');
    expect(client).toBeDefined();
    client.setAuthToken('test-token');
  });

  it('instantiates ApiClientError with full properties', () => {
    const err = new ApiClientError(404, 'NOT_FOUND', 'Item missing', 'req-123', [
      { field: 'id', message: 'Required' },
    ]);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Item missing');
    expect(err.requestId).toBe('req-123');
    expect(err.details).toHaveLength(1);
  });
});
