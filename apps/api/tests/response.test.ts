import { describe, it, expect } from 'vitest';
import { sendSuccess, sendError } from '../src/utils/response.js';

describe('Response Utility', () => {
  it('formats success response correctly', () => {
    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: any) {
        capturedBody = body;
        return this;
      },
    };

    sendSuccess(mockRes, { foo: 'bar' }, 200, 'Success message');

    expect(capturedStatus).toBe(200);
    expect(capturedBody.success).toBe(true);
    expect(capturedBody.data).toEqual({ foo: 'bar' });
    expect(capturedBody.message).toBe('Success message');
    expect(capturedBody.timestamp).toBeDefined();
  });

  it('formats error response correctly', () => {
    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: any) {
        capturedBody = body;
        return this;
      },
    };

    sendError(mockRes, 404, 'NOT_FOUND', 'Item was not found', [
      { field: 'id', message: 'Item does not exist' },
    ]);

    expect(capturedStatus).toBe(404);
    expect(capturedBody.success).toBe(false);
    expect(capturedBody.error.code).toBe('NOT_FOUND');
    expect(capturedBody.error.details).toHaveLength(1);
  });
});
