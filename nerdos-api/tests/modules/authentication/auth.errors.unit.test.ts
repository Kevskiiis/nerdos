import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/exceptions/app-error.js';
import { ErrorCode } from '../../../src/shared/exceptions/error-codes.js';
import { mapAuthError } from '../../../src/modules/authentication/auth.errors.js';

describe('mapAuthError', () => {
  it.each([
    ...['INVALID_EMAIL_OR_PASSWORD', 'INVALID_PASSWORD', 'invalid_credentials'].map((code) => [code, 401, 'INVALID_CREDENTIALS', false] as const),
    ...['EMAIL_NOT_VERIFIED', 'email_not_confirmed'].map((code) => [code, 403, 'EMAIL_NOT_VERIFIED', false] as const),
    ...['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'EMAIL_ALREADY_EXISTS'].map((code) => [code, 409, 'EMAIL_ALREADY_EXISTS', false] as const),
    ...['INVALID_OTP', 'OTP_EXPIRED', 'INVALID_TOKEN', 'EXPIRED_TOKEN', 'INVALID_OR_EXPIRED_CODE', 'INVALID_RESET_TOKEN'].map((code) => [code, 400, 'INVALID_OR_EXPIRED_CODE', false] as const),
    ...['SESSION_EXPIRED', 'SESSION_NOT_FOUND', 'INVALID_SESSION', 'UNAUTHORIZED'].map((code) => [code, 401, 'UNAUTHORIZED', false] as const),
    ...['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].map((code) => [code, 503, 'SERVICE_UNAVAILABLE', true] as const),
  ])('maps %s', (code, status, expected, retryable) => {
    expect(mapAuthError({ code, message: 'secret' })).toMatchObject({ status, code: expected, retryable });
  });
  it('handles nested errors, HTTP status, and network causes', () => {
    expect(mapAuthError({ body: { code: 'INVALID_OTP' } }).code).toBe('INVALID_OR_EXPIRED_CODE');
    expect(mapAuthError({ error: { code: 'EMAIL_NOT_VERIFIED' } }).code).toBe('EMAIL_NOT_VERIFIED');
    expect(mapAuthError({ status: 401 }).code).toBe('UNAUTHORIZED');
    expect(mapAuthError({ status: 502, code: 'INVALID_OTP' })).toMatchObject({ status: 503, retryable: true });
    expect(mapAuthError(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } })).code).toBe('SERVICE_UNAVAILABLE');
  });
  it('preserves AppError and safely handles unknown failures', () => {
    const original = new AppError({ status: 400, code: ErrorCode.BAD_REQUEST, detail: 'known' });
    expect(mapAuthError(original)).toBe(original);
    expect(mapAuthError(new Error('private detail'))).toMatchObject({ status: 500, code: 'INTERNAL_ERROR', detail: 'Authentication failed.', retryable: false });
  });
});
