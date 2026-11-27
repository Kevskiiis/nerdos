import { NEON_AUTH_SESSION_COOKIE_NAME } from '@neondatabase/auth/server';
import type { Redis } from 'ioredis';
import type { Sql } from 'postgres';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../../src/app.js';
import type { AuthClient } from '../../../src/modules/authentication/auth.client.js';
import { loadEnv } from '../../../src/shared/config/env.js';
import { errorResponseSchema } from '../../../src/shared/exceptions/error-schema.js';

const env = loadEnv({ NODE_ENV: 'test', LOG_LEVEL: 'silent', REDIS_URL: 'rediss://user:pass@host', DATABASE_URL: 'postgresql://localhost/test', CLIENT_ORIGIN: 'https://client.example.com', NEON_AUTH_BASE_URL: 'https://auth.example.com', NEON_AUTH_COOKIE_SECRET: 'x'.repeat(32) });
const user = { id: 'u1', email: 'user@example.com', name: 'User', emailVerified: true };
const token = `${NEON_AUTH_SESSION_COOKIE_NAME}=abc`;
const userResult = { data: { user }, setCookies: [`${token}; SameSite=Lax; Path=/`] };
const empty = { data: {}, setCookies: [] };
const registration = { name: 'First Last', email: user.email, password: 'long-password-123' };
let app: Awaited<ReturnType<typeof buildApp>>;
let client: { [K in keyof AuthClient]: ReturnType<typeof vi.fn> };
let counters: Map<string, number>;
let redis: { on: ReturnType<typeof vi.fn>; quit: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; ping: ReturnType<typeof vi.fn>; defineCommand: ReturnType<typeof vi.fn>; nerdosRateLimit: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  counters = new Map();
  redis = { on: vi.fn(), quit: vi.fn().mockResolvedValue('OK'), disconnect: vi.fn(), ping: vi.fn().mockResolvedValue('PONG'), defineCommand: vi.fn(), nerdosRateLimit: vi.fn((key: string, window: number, callback: (error: Error | null, result: number[]) => void) => { const count = (counters.get(key) ?? 0) + 1; counters.set(key, count); callback(null, [count, window]); }) };
  const query = Object.assign(Promise.resolve([]), { cancel: vi.fn() });
  const sql = Object.assign(vi.fn(() => query), { end: vi.fn() });
  client = { signUp: vi.fn().mockResolvedValue(empty), verifyEmail: vi.fn().mockResolvedValue(userResult), resendVerification: vi.fn().mockResolvedValue(empty), signIn: vi.fn().mockResolvedValue(userResult), signOut: vi.fn().mockResolvedValue(empty), revokeAllSessions: vi.fn().mockResolvedValue(empty), getSession: vi.fn().mockResolvedValue({ sessionId: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' }), getMe: vi.fn().mockResolvedValue(user), forgotPassword: vi.fn().mockResolvedValue(empty), resetPassword: vi.fn().mockResolvedValue(empty), changePassword: vi.fn().mockResolvedValue(empty) };
  app = await buildApp({ env, sql: sql as unknown as Sql, redis: redis as unknown as Redis, authClient: client as unknown as AuthClient });
});
afterEach(async () => { await app?.close(); });
const headers = { cookie: token, origin: env.CLIENT_ORIGIN };
function cookies(response: { headers: Record<string, unknown> }): string[] { const value = response.headers['set-cookie']; return Array.isArray(value) ? value : value ? [String(value)] : []; }

describe('authentication routes', () => {
  it.each([
    ['missing', undefined, 'Enter the verification code.'],
    ['blank', '   ', 'Enter the verification code.'],
    ['letters', '12ab56', 'Verification code must contain only numbers.'],
    ['hyphen', '123-456', 'Verification code must contain only numbers.'],
    ['short', '12345', 'Verification code must be 6 digits.'],
    ['long', '1234567', 'Verification code must be 6 digits.'],
  ])('returns a friendly error for a %s verification code', async (_description, code, message) => {
    for (const path of ['verify-email', 'reset-password']) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/auth/${path}`, payload: { email: user.email, code, newPassword: 'new-password-123' } });
      expect(response.statusCode).toBe(422);
      expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: expect.arrayContaining([expect.objectContaining({ path: '/code', message })]) } });
    }
    expect(client.verifyEmail).not.toHaveBeenCalled();
    expect(client.resetPassword).not.toHaveBeenCalled();
  });
  it('normalizes six-digit verification codes before calling the provider', async () => {
    const verify = await app.inject({ method: 'POST', url: '/api/v1/auth/verify-email', payload: { email: user.email, code: ' 012345 ' } });
    expect(verify.statusCode).toBe(200);
    expect(client.verifyEmail).toHaveBeenCalledWith({ email: user.email, code: '012345' });
    const reset = await app.inject({ method: 'POST', url: '/api/v1/auth/reset-password', payload: { email: user.email, code: ' 012345 ', newPassword: 'new-password-123' } });
    expect(reset.statusCode).toBe(200);
    expect(client.resetPassword).toHaveBeenCalledWith({ email: user.email, code: '012345', newPassword: 'new-password-123' });
  });
  it.each([undefined, '', '   '])('requires a name when registration receives %s', async (name) => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { ...registration, name } });
    expect(response.statusCode).toBe(422);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: expect.arrayContaining([expect.objectContaining({ path: '/name', message: 'Enter your name.' })]) } });
    expect(client.signUp).not.toHaveBeenCalled();
  });
  it('trims and forwards a full name to registration', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { ...registration, name: '  Alex García  ' } });
    expect(response.statusCode).toBe(201);
    expect(client.signUp).toHaveBeenCalledWith({ ...registration, name: 'Alex García' });
  });
  it.each([
    ['missing', undefined, 'Enter an email address.'],
    ['blank', '   ', 'Enter an email address.'],
    ['too long', `${'a'.repeat(65)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`, 'Email address must be at most 254 characters.'],
    ['malformed', 'not-an-email', 'Enter a valid email address.'],
  ])('returns a friendly error for a %s email on authentication endpoints', async (_description, email, message) => {
    const payloads = [
      ['/register', { ...registration, email }],
      ['/login', { email, password: registration.password }],
      ['/forgot-password', { email }],
    ] as const;
    for (const [path, payload] of payloads) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/auth${path}`, payload });
      expect(response.statusCode).toBe(422);
      expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: expect.arrayContaining([expect.objectContaining({ path: '/email', message })]) } });
    }
    expect(client.signUp).not.toHaveBeenCalled();
    expect(client.signIn).not.toHaveBeenCalled();
    expect(client.forgotPassword).not.toHaveBeenCalled();
  });
  it('normalizes valid emails before passing them to authentication operations', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: '  User@Example.COM  ', password: registration.password } });
    expect(response.statusCode).toBe(200);
    expect(client.signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: registration.password });
  });
  it('validates registration, registers valid requests, and supports credentialed CORS', async () => {
    const invalid = await app.inject({ method: 'POST', url: '/api/v1/auth/register', headers, payload: { ...registration, password: 'short' } });
    expect(invalid.statusCode).toBe(422);
    expect(errorResponseSchema.parse(invalid.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: [{ path: '/password', message: 'Password must be at least 12 characters.' }] } });
    const valid = await app.inject({ method: 'POST', url: '/api/v1/auth/register', headers, payload: registration });
    expect(valid.statusCode).toBe(201);
    expect(valid.json()).toEqual({ message: expect.any(String) });
    expect(valid.headers['access-control-allow-origin']).toBe(env.CLIENT_ORIGIN);
    expect(valid.headers['access-control-allow-credentials']).toBe('true');
    expect(client.signUp).toHaveBeenCalledWith(registration);
  });
  it.each([
    ['too short', 'x'.repeat(11), 'Password must be at least 12 characters.'],
    ['too long', 'x'.repeat(129), 'Password must be at most 128 characters.'],
    ['blank', ' '.repeat(12), 'Password cannot be blank.'],
    ['control character', 'password1234\n', 'Password may only contain letters, numbers, spaces, and standard special characters.'],
    ['emoji', 'password1234🔥', 'Password may only contain letters, numbers, spaces, and standard special characters.'],
    ['non-ASCII', 'pássword1234', 'Password may only contain letters, numbers, spaces, and standard special characters.'],
  ])('rejects a %s new password on all three routes before password operations', async (_description, password, message) => {
    for (const [path, payload, field] of [
      ['register', { ...registration, password }, '/password'],
      ['reset-password', { email: user.email, code: '123456', newPassword: password }, '/newPassword'],
      ['change-password', { currentPassword: 'legacy8', newPassword: password }, '/newPassword'],
    ] as const) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/auth/${path}`, headers, payload });
      expect(response.statusCode).toBe(422);
      expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: expect.arrayContaining([expect.objectContaining({ path: field, message })]) } });
    }
    expect(client.signUp).not.toHaveBeenCalled();
    expect(client.resetPassword).not.toHaveBeenCalled();
    expect(client.changePassword).not.toHaveBeenCalled();
    expect(client.signIn).not.toHaveBeenCalled();
  });
  it('allows legacy passwords on login and rejects identical password changes', async () => {
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: user.email, password: 'short8ch' } });
    expect(login.statusCode).toBe(200);
    expect(client.signIn).toHaveBeenCalledWith({ email: user.email, password: 'short8ch' });
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/change-password', headers, payload: { currentPassword: 'same-password', newPassword: 'same-password' } });
    expect(response.statusCode).toBe(422);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: expect.arrayContaining([expect.objectContaining({ path: '/newPassword', message: 'New password must be different from current password.' })]) } });
    expect(client.changePassword).not.toHaveBeenCalled();
  });
  it('verifies email and logs in with normalized cross-site cookies', async () => {
    for (const [path, payload] of [['verify-email', { email: user.email, code: '123456' }], ['login', { email: user.email, password: registration.password }]] as const) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/auth/${path}`, payload });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user });
      expect(cookies(response)[0]).toContain('SameSite=None; Secure; HttpOnly; Path=/');
    }
  });
  it('protects the user profile and handles an expired upstream profile', async () => {
    expect((await app.inject('/api/v1/auth/me')).json()).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    const response = await app.inject({ url: '/api/v1/auth/me', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user });
    client.getMe.mockResolvedValueOnce(null);
    expect((await app.inject({ url: '/api/v1/auth/me', headers })).statusCode).toBe(401);
    client.getSession.mockResolvedValueOnce({ sessionId: '', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' });
    expect((await app.inject({ url: '/api/v1/auth/me', headers })).json()).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
  });
  it('sends generic email responses and clears cookies on logout', async () => {
    for (const path of ['resend-verification', 'forgot-password']) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/auth/${path}`, payload: { email: user.email } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: expect.any(String) });
    }
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers });
    expect(response.statusCode).toBe(200);
    expect(client.signOut).toHaveBeenCalledWith(token);
    expect(cookies(response)).toEqual(expect.arrayContaining([expect.stringContaining('Max-Age=0')]));
  });
  it('resets passwords, changes passwords, and revokes all sessions', async () => {
    const reset = await app.inject({ method: 'POST', url: '/api/v1/auth/reset-password', payload: { email: user.email, code: '123456', newPassword: 'new-password-123' } });
    expect(reset.statusCode).toBe(200);
    expect(client.revokeAllSessions).toHaveBeenCalledWith(token);
    expect(cookies(reset).every((cookie) => cookie.includes('Max-Age=0'))).toBe(true);
    const change = await app.inject({ method: 'POST', url: '/api/v1/auth/change-password', headers, payload: { currentPassword: 'old-password-123', newPassword: 'new-password-123' } });
    expect(change.statusCode).toBe(200);
    expect(client.changePassword).toHaveBeenCalledWith(token, { currentPassword: 'old-password-123', newPassword: 'new-password-123', revokeOtherSessions: true });
    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout-all', headers });
    expect(logout.statusCode).toBe(200);
    expect(client.revokeAllSessions).toHaveBeenCalledTimes(2);
    expect(cookies(logout).length).toBeGreaterThan(0);
    expect(cookies(logout).every((cookie) => cookie.includes('Max-Age=0'))).toBe(true);
  });
  it('uses global IP and authenticated user limits on sensitive operations', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/change-password', headers, payload: { currentPassword: 'old-password-123', newPassword: 'new-password-123' } });
      expect(response.statusCode).toBe(200);
    }
    const limited = await app.inject({ method: 'POST', url: '/api/v1/auth/logout-all', headers });
    expect(limited.statusCode).toBe(429);
    expect(errorResponseSchema.parse(limited.json()).code).toBe('RATE_LIMITED');
    expect(counters.get('nerdos:test:rl:auth-user-sensitive:u1')).toBe(11);
    expect(counters.get('nerdos:test:rl:global:127.0.0.1')).toBe(11);
    expect(client.revokeAllSessions).not.toHaveBeenCalled();
  });
  it('exposes all routes in OpenAPI and fails closed on a Redis outage', async () => {
    const spec = (await app.inject('/docs/json')).json();
    expect(Object.keys(spec.paths).filter((path: string) => path.startsWith('/api/v1/auth/'))).toHaveLength(10);
    redis.nerdosRateLimit.mockImplementation((_key, _window, callback) => callback(new Error('offline')));
    const response = await app.inject({ url: '/api/v1/auth/me', headers });
    expect(response.statusCode).toBe(503);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'SERVICE_UNAVAILABLE', retryable: true });
  });
});
