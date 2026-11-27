import type { preHandlerHookHandler } from 'fastify';
import { AppError } from '../../shared/exceptions/app-error.js';
import { ErrorCode } from '../../shared/exceptions/error-codes.js';
import { requestSessionSchema } from '../../shared/http/session.schema.js';

/** Creates a guard that validates and attaches only a minimal authenticated session. */
export function createRequireAuth(getSession: (cookieHeader: string) => Promise<unknown>): preHandlerHookHandler {
  return async (request) => {
    const unauthorized = () => new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, detail: 'Authentication required.' });
    const cookie = request.headers.cookie;
    if (!cookie) throw unauthorized();
    const result = requestSessionSchema.safeParse(await getSession(cookie));
    if (!result.success || Date.parse(result.data.expiresAt) <= Date.now()) throw unauthorized();
    request.session = result.data;
  };
}
