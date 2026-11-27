import { NEON_AUTH_SESSION_COOKIE_NAME, NEON_AUTH_SESSION_DATA_COOKIE_NAME, NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME } from '@neondatabase/auth/server';
import { AppError } from '../../shared/exceptions/app-error.js';
import { ErrorCode } from '../../shared/exceptions/error-codes.js';
import { requestSessionSchema } from '../../shared/http/session.schema.js';
import { normalizeCrossSiteCookies, type AuthClient } from './auth.client.js';
import { mapAuthError } from './auth.errors.js';
import { authUserSchema } from './auth.schemas.js';

const verificationMessage = { message: 'If the account exists, a verification code has been sent.' };
const resetMessage = { message: 'If the account exists, a password reset code has been sent.' };
const unavailable = () => new AppError({ status: 503, code: ErrorCode.SERVICE_UNAVAILABLE, detail: 'Authentication service unavailable.', retryable: true });

function isMissingUser(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const root = error as Record<string, unknown>;
  return [root, root.error, root.body].some((value) => {
    if (!value || typeof value !== 'object') return false;
    const code = (value as Record<string, unknown>).code;
    return typeof code === 'string' && ['USER_NOT_FOUND', 'USER_NOT_EXIST'].includes(code.toUpperCase());
  });
}

function clearCookies(): string[] {
  return normalizeCrossSiteCookies([NEON_AUTH_SESSION_COOKIE_NAME, NEON_AUTH_SESSION_DATA_COOKIE_NAME, NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME]
    .map((name) => `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`));
}

function sessionCookie(cookies: string[]): string | null {
  const value = cookies.map((cookie) => cookie.split(';', 1)[0].trim()).find((cookie) => cookie.startsWith(`${NEON_AUTH_SESSION_COOKIE_NAME}=`));
  return value && value.slice(value.indexOf('=') + 1) ? value : null;
}

/** Creates the authentication service around an injectable upstream client. */
export function createAuthService(authClient: AuthClient) {
  async function call<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) { throw mapAuthError(error); }
  }
  async function emailAction(operation: () => Promise<unknown>): Promise<void> {
    try { await operation(); } catch (error) { if (!isMissingUser(error)) throw mapAuthError(error); }
  }
  return {
    async register(input: { username: string; email: string; password: string }) {
      return call(async () => {
        await authClient.signUp(input);
        await authClient.resendVerification({ email: input.email });
        return { message: 'Account created. Check your email for a verification code.' };
      });
    },
    async verifyEmail(input: { email: string; code: string }) {
      return call(async () => {
        const result = await authClient.verifyEmail(input);
        if (!sessionCookie(result.setCookies)) throw unavailable();
        return { user: authUserSchema.parse(result.data.user), setCookies: normalizeCrossSiteCookies(result.setCookies) };
      });
    },
    async resendVerification(input: { email: string }) {
      await emailAction(() => authClient.resendVerification(input));
      return verificationMessage;
    },
    async login(input: { email: string; password: string }) {
      return call(async () => {
        const result = await authClient.signIn(input);
        const user = authUserSchema.parse(result.data.user);
        if (!user.emailVerified) throw new AppError({ status: 403, code: ErrorCode.EMAIL_NOT_VERIFIED, detail: 'Email address is not verified.' });
        return { user, setCookies: normalizeCrossSiteCookies(result.setCookies) };
      });
    },
    async logout(cookieHeader: string) {
      return call(async () => { await authClient.signOut(cookieHeader); return { message: 'Signed out.', setCookies: clearCookies() }; });
    },
    async logoutAll(cookieHeader: string) {
      return call(async () => { await authClient.revokeAllSessions(cookieHeader); return { message: 'Signed out of all sessions.', setCookies: clearCookies() }; });
    },
    async getSession(cookieHeader: string) {
      return call(async () => { const session = await authClient.getSession(cookieHeader); return session === null ? null : requestSessionSchema.parse(session); });
    },
    async getMe(cookieHeader: string) {
      return call(async () => { const user = await authClient.getMe(cookieHeader); return user === null ? null : authUserSchema.parse(user); });
    },
    async forgotPassword(input: { email: string }) {
      await emailAction(() => authClient.forgotPassword(input));
      return resetMessage;
    },
    async resetPassword(input: { email: string; code: string; newPassword: string }) {
      return call(async () => {
        await authClient.resetPassword(input);
        const signIn = await authClient.signIn({ email: input.email, password: input.newPassword });
        const cookie = sessionCookie(signIn.setCookies);
        if (!cookie) throw unavailable();
        await authClient.revokeAllSessions(cookie);
        return { message: 'Password reset.', setCookies: clearCookies() };
      });
    },
    async changePassword(cookieHeader: string, input: { currentPassword: string; newPassword: string }) {
      return call(async () => {
        await authClient.changePassword(cookieHeader, { ...input, revokeOtherSessions: true });
        return { message: 'Password changed.' };
      });
    },
  };
}
