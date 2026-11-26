import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/exceptions/app-error.js';
import { ErrorCode } from '../../../src/shared/exceptions/error-codes.js';

describe('AppError', () => {
  it('is an Error with the specified public properties', () => {
    const meta_data = { resource: 'account' };
    const error = new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, detail: 'Sign in', retryable: true, meta_data });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ name: 'AppError', message: 'Sign in', status: 401, code: 'UNAUTHORIZED', detail: 'Sign in', retryable: true, meta_data });
  });

  it('defaults to non-retryable with no metadata', () => {
    const error = new AppError({ status: 404, code: ErrorCode.NOT_FOUND, detail: 'Missing' });
    expect(error.retryable).toBe(false);
    expect(error.meta_data).toBeUndefined();
  });
});
