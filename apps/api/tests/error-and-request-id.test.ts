import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { AppError, NotFoundError } from '../src/errors/app-error.js';

describe('Error & Request ID Architecture', () => {
  it('instantiates custom errors with correct status codes and codes', () => {
    const notFound = new NotFoundError('Item not found');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe('NOT_FOUND');
    expect(notFound.message).toBe('Item not found');
    expect(notFound.isOperational).toBe(true);
  });

  it('creates express app with request ID and error handling configured', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
