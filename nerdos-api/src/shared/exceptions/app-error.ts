import type { ErrorCode } from './error-codes.js';

interface AppErrorOptions {
  status: number;
  code: ErrorCode;
  detail: string;
  retryable?: boolean;
  meta_data?: Record<string, unknown>;
}

/** Represents an intentional API error with a safe public detail and stable error code. */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly detail: string;
  readonly retryable: boolean;
  readonly meta_data?: Record<string, unknown>;

  constructor({ status, code, detail, retryable = false, meta_data }: AppErrorOptions) {
    super(detail);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.retryable = retryable;
    this.meta_data = meta_data;
  }
}
