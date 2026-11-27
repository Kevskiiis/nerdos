import { AppError } from '../../shared/exceptions/app-error.js';
import { ErrorCode } from '../../shared/exceptions/error-codes.js';

type ErrorMapping = { status: number; code: ErrorCode; detail: string; retryable?: boolean };
const credentials: ErrorMapping = { status: 401, code: ErrorCode.INVALID_CREDENTIALS, detail: 'Invalid email or password.' };
const unverified: ErrorMapping = { status: 403, code: ErrorCode.EMAIL_NOT_VERIFIED, detail: 'Email address is not verified.' };
const duplicate: ErrorMapping = { status: 409, code: ErrorCode.EMAIL_ALREADY_EXISTS, detail: 'Email address already exists.' };
const invalidCode: ErrorMapping = { status: 400, code: ErrorCode.INVALID_OR_EXPIRED_CODE, detail: 'Invalid or expired code.' };
const unauthorized: ErrorMapping = { status: 401, code: ErrorCode.UNAUTHORIZED, detail: 'Authentication required.' };
const unavailable: ErrorMapping = { status: 503, code: ErrorCode.SERVICE_UNAVAILABLE, detail: 'Authentication service unavailable.', retryable: true };
const mappings: Record<string, ErrorMapping> = {
  INVALID_EMAIL_OR_PASSWORD: credentials, INVALID_PASSWORD: credentials, INVALID_CREDENTIALS: credentials,
  EMAIL_NOT_VERIFIED: unverified, EMAIL_NOT_CONFIRMED: unverified,
  USER_ALREADY_EXISTS: duplicate, USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: duplicate, EMAIL_ALREADY_EXISTS: duplicate,
  INVALID_OTP: invalidCode, OTP_EXPIRED: invalidCode, INVALID_TOKEN: invalidCode, EXPIRED_TOKEN: invalidCode,
  INVALID_OR_EXPIRED_CODE: invalidCode, INVALID_RESET_TOKEN: invalidCode,
  SESSION_EXPIRED: unauthorized, SESSION_NOT_FOUND: unauthorized, INVALID_SESSION: unauthorized, UNAUTHORIZED: unauthorized,
  ECONNREFUSED: unavailable, ECONNRESET: unavailable, ETIMEDOUT: unavailable, ENOTFOUND: unavailable,
};

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

/** Maps Neon Auth and Better Auth failures to safe, canonical API errors. */
export function mapAuthError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const root = object(error);
  const nested = object(root.error);
  const body = object(root.body);
  const code = [root.code, nested.code, body.code].find((value) => typeof value === 'string');
  const status = [root.status, root.statusCode, nested.status, nested.statusCode].find((value) => typeof value === 'number');
  if ((typeof status === 'number' && status >= 500) || (error instanceof TypeError && /fetch|network/i.test(error.message)) || mappings[String(object(root.cause).code ?? '').toUpperCase()] === unavailable) return new AppError(unavailable);
  const mapped = typeof code === 'string' ? mappings[code.toUpperCase()] : undefined;
  if (mapped) return new AppError(mapped);
  if (status === 401) return new AppError(unauthorized);
  return new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, detail: 'Authentication failed.' });
}
