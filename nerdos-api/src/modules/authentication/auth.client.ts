import { createAuthServer, serializeSetCookie } from '@neondatabase/auth/server';
import type { Env } from '../../shared/config/env.js';
import type { RequestSession } from '../../shared/http/session.schema.js';
import { authUserSchema, type AuthUser } from './auth.schemas.js';

/** An upstream result together with cookies to forward to the caller. */
export type AuthResult<T> = { data: T; setCookies: string[] };
/** Operations needed by the authentication service, independent of the upstream SDK. */
export interface AuthClient {
  signUp(input: { name: string; email: string; password: string }): Promise<AuthResult<unknown>>;
  verifyEmail(input: { email: string; code: string }): Promise<AuthResult<{ user: AuthUser }>>;
  resendVerification(input: { email: string }): Promise<AuthResult<unknown>>;
  signIn(input: { email: string; password: string }): Promise<AuthResult<{ user: AuthUser }>>;
  signOut(cookieHeader: string): Promise<AuthResult<unknown>>;
  revokeAllSessions(cookieHeader: string): Promise<AuthResult<unknown>>;
  getSession(cookieHeader: string): Promise<RequestSession | null>;
  getMe(cookieHeader: string): Promise<AuthUser | null>;
  forgotPassword(input: { email: string }): Promise<AuthResult<unknown>>;
  resetPassword(input: { email: string; code: string; newPassword: string }): Promise<AuthResult<unknown>>;
  changePassword(cookieHeader: string, input: { currentPassword: string; newPassword: string; revokeOtherSessions: boolean }): Promise<AuthResult<unknown>>;
}

/** Enforces cross-site cookie attributes while preserving expiration and other attributes. */
export function normalizeCrossSiteCookies(setCookieHeaders: string[]): string[] {
  return setCookieHeaders.map((header) => {
    const [cookie, ...attributes] = header.split(';');
    const remaining = attributes.map((value) => value.trim()).filter((value) => value && !/^(samesite|secure|httponly|path)(?:\s*=|\s*$)/i.test(value));
    return [cookie.trim(), ...remaining, 'SameSite=None', 'Secure', 'HttpOnly', 'Path=/'].join('; ');
  });
}

/** Creates a request-isolated adapter around the Neon Auth server SDK. */
export function createNeonAuthClient(env: Pick<Env, 'NEON_AUTH_BASE_URL' | 'NEON_AUTH_COOKIE_SECRET' | 'CLIENT_ORIGIN'>): AuthClient {
  function context(cookieHeader = '') {
    const setCookies: string[] = [];
    const server = createAuthServer({
      baseUrl: env.NEON_AUTH_BASE_URL, cookieSecret: env.NEON_AUTH_COOKIE_SECRET, sameSite: 'none',
      context: () => ({
        getCookies: () => cookieHeader,
        getHeader: (name) => name.toLowerCase() === 'cookie' ? cookieHeader : null,
        getOrigin: () => env.CLIENT_ORIGIN,
        getFramework: () => 'fastify',
        setCookie: (name, value, options) => { setCookies.push(serializeSetCookie({ name, value, ...options })); },
      }),
    });
    return { server, setCookies };
  }
  async function run<T>(cookie: string, action: (server: ReturnType<typeof createAuthServer>) => Promise<{ data: T | null; error: unknown }>): Promise<AuthResult<T>> {
    const { server, setCookies } = context(cookie);
    const result = await action(server);
    if (result.error) throw result.error;
    return { data: result.data as T, setCookies: normalizeCrossSiteCookies(setCookies) };
  }
  async function session(cookie: string) {
    // Always consult the upstream so revoked sessions cannot survive a cached cookie.
    return (await run(cookie, (server) => server.getSession({ query: { disableCookieCache: 'true' } }))).data;
  }
  return {
    signUp: ({ name, email, password }) => run('', (server) => server.signUp.email({ name, email, password })),
    verifyEmail: async ({ email, code }) => {
      const result = await run('', (server) => server.emailOtp.verifyEmail({ email, otp: code }));
      return { ...result, data: { user: authUserSchema.parse(result.data?.user) } };
    },
    resendVerification: ({ email }) => run('', (server) => server.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })),
    signIn: async ({ email, password }) => {
      const result = await run('', (server) => server.signIn.email({ email, password }));
      return { ...result, data: { user: authUserSchema.parse(result.data?.user) } };
    },
    signOut: (cookie) => run(cookie, (server) => server.signOut()),
    revokeAllSessions: (cookie) => run(cookie, (server) => server.revokeSessions()),
    getSession: async (cookie) => {
      const data = await session(cookie);
      if (!data?.session || !data.user) return null;
      return { sessionId: data.session.id, userId: data.session.userId, expiresAt: new Date(data.session.expiresAt).toISOString() };
    },
    getMe: async (cookie) => { const data = await session(cookie); return data?.user ? authUserSchema.parse(data.user) : null; },
    forgotPassword: ({ email }) => run('', (server) => server.emailOtp.sendVerificationOtp({ email, type: 'forget-password' })),
    // SDK 0.7.0-beta maps emailOtp.resetPassword to a different path; use the
    // Better Auth OTP endpoint directly until its server mapping is corrected.
    resetPassword: async ({ email, code, newPassword }) => {
      const response = await fetch(new URL('email-otp/reset-password', `${env.NEON_AUTH_BASE_URL.replace(/\/$/, '')}/`), {
        method: 'POST', headers: { 'content-type': 'application/json', origin: env.CLIENT_ORIGIN },
        body: JSON.stringify({ email, otp: code, password: newPassword }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw { status: response.status, body: data };
      return { data, setCookies: normalizeCrossSiteCookies(response.headers.getSetCookie()) };
    },
    changePassword: (cookie, input) => run(cookie, (server) => server.changePassword(input)),
  };
}
