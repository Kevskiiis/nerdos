import { NEON_AUTH_SESSION_COOKIE_NAME, NEON_AUTH_SESSION_DATA_COOKIE_NAME } from '@neondatabase/auth/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthClient } from '../../../src/modules/authentication/auth.client.js';
import { createAuthService } from '../../../src/modules/authentication/auth.service.js';

const user = { id: 'u1', email: 'user@example.com', emailVerified: true, name: 'User' };
const session = { sessionId: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' };
const token = `${NEON_AUTH_SESSION_COOKIE_NAME}=abc`;
const cookies = [`${token}; HttpOnly; Secure; SameSite=Lax; Path=/`];
const empty = { data: {}, setCookies: [] as string[] };
const userResult = { data: { user }, setCookies: cookies };
const input = { email: user.email, password: 'long-password' };
let client: { [K in keyof AuthClient]: ReturnType<typeof vi.fn> };
let service: ReturnType<typeof createAuthService>;
beforeEach(() => {
  client = {
    signUp: vi.fn().mockResolvedValue(empty), verifyEmail: vi.fn().mockResolvedValue(userResult),
    resendVerification: vi.fn().mockResolvedValue(empty), signIn: vi.fn().mockResolvedValue(userResult),
    signOut: vi.fn().mockResolvedValue(empty), revokeAllSessions: vi.fn().mockResolvedValue(empty),
    getSession: vi.fn().mockResolvedValue(session), getMe: vi.fn().mockResolvedValue(user),
    forgotPassword: vi.fn().mockResolvedValue(empty), resetPassword: vi.fn().mockResolvedValue(empty),
    changePassword: vi.fn().mockResolvedValue(empty),
  };
  service = createAuthService(client as unknown as AuthClient);
});

describe('authentication service', () => {
  it('registers without forwarding cookies and sends a verification code', async () => {
    client.signUp.mockResolvedValue({ data: {}, setCookies: cookies });
    const register = { ...input, username: 'User' };
    expect(await service.register(register)).toEqual({ message: expect.any(String) });
    expect(client.signUp).toHaveBeenCalledWith(register);
    expect(client.resendVerification).toHaveBeenCalledWith({ email: user.email });
  });
  it('forwards normalized verification cookies and requires an auto-login session', async () => {
    const response = await service.verifyEmail({ email: user.email, code: '123456' });
    expect(response).toEqual({ user, setCookies: [`${token}; SameSite=None; Secure; HttpOnly; Path=/`] });
    client.verifyEmail.mockResolvedValue({ data: { user }, setCookies: [] });
    await expect(service.verifyEmail({ email: user.email, code: '123456' })).rejects.toMatchObject({ status: 503, retryable: true });
  });
  it('rejects unverified accounts at login and forwards verified sessions', async () => {
    client.signIn.mockResolvedValueOnce({ ...userResult, data: { user: { ...user, emailVerified: false } } });
    await expect(service.login(input)).rejects.toMatchObject({ status: 403, code: 'EMAIL_NOT_VERIFIED' });
    expect(await service.login(input)).toMatchObject({ user, setCookies: [`${token}; SameSite=None; Secure; HttpOnly; Path=/`] });
  });
  it.each(['resendVerification', 'forgotPassword'] as const)('prevents enumeration for %s without hiding outages', async (method) => {
    const generic = await service[method]({ email: user.email });
    client[method].mockRejectedValueOnce({ code: 'USER_NOT_FOUND' });
    expect(await service[method]({ email: user.email })).toEqual(generic);
    client[method].mockRejectedValueOnce({ status: 503 });
    await expect(service[method]({ email: user.email })).rejects.toMatchObject({ status: 503, retryable: true });
  });
  it('revokes the current or all sessions and clears browser cookies', async () => {
    const logout = await service.logout('cookie=1');
    expect(client.signOut).toHaveBeenCalledWith('cookie=1');
    const logoutAll = await service.logoutAll('cookie=2');
    expect(client.revokeAllSessions).toHaveBeenCalledWith('cookie=2');
    for (const result of [logout, logoutAll]) {
      expect(result.setCookies).toEqual(expect.arrayContaining([expect.stringContaining(`${NEON_AUTH_SESSION_COOKIE_NAME}=; Max-Age=0`), expect.stringContaining(`${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=; Max-Age=0`)]));
      expect(result.setCookies.every((cookie) => cookie.includes('SameSite=None; Secure; HttpOnly; Path=/'))).toBe(true);
    }
  });
  it('separates session and profile information', async () => {
    client.getSession.mockResolvedValue({ ...session, ignored: 'x' });
    expect(await service.getSession('cookie')).toEqual(session);
    expect(await service.getMe('cookie')).toEqual(user);
    client.getSession.mockResolvedValue(null);
    client.getMe.mockResolvedValue(null);
    expect(await service.getSession('cookie')).toBeNull();
    expect(await service.getMe('cookie')).toBeNull();
  });
  it('resets the password, then revokes all sessions using a newly authenticated session', async () => {
    const reset = { email: user.email, code: '123456', newPassword: 'new-password-123' };
    const result = await service.resetPassword(reset);
    expect(client.resetPassword).toHaveBeenCalledWith(reset);
    expect(client.signIn).toHaveBeenCalledWith({ email: user.email, password: reset.newPassword });
    expect(client.revokeAllSessions).toHaveBeenCalledWith(token);
    expect(client.resetPassword.mock.invocationCallOrder[0]).toBeLessThan(client.signIn.mock.invocationCallOrder[0]);
    expect(client.signIn.mock.invocationCallOrder[0]).toBeLessThan(client.revokeAllSessions.mock.invocationCallOrder[0]);
    expect(result.setCookies[0]).toContain('Max-Age=0');
  });
  it('fails the reset when a revocation session is unavailable or revocation fails', async () => {
    client.signIn.mockResolvedValueOnce({ data: { user }, setCookies: [] });
    const reset = { email: user.email, code: '123456', newPassword: 'new-password-123' };
    await expect(service.resetPassword(reset)).rejects.toMatchObject({ status: 503 });
    expect(client.revokeAllSessions).not.toHaveBeenCalled();
    client.revokeAllSessions.mockRejectedValueOnce({ status: 503 });
    await expect(service.resetPassword(reset)).rejects.toMatchObject({ status: 503, retryable: true });
  });
  it('requests revocation of other sessions when changing password', async () => {
    const change = { currentPassword: 'old-password-123', newPassword: 'new-password-123' };
    expect(await service.changePassword('cookie', change)).toEqual({ message: expect.any(String) });
    expect(client.changePassword).toHaveBeenCalledWith('cookie', { ...change, revokeOtherSessions: true });
  });
  it('maps upstream failures without leaking details', async () => {
    client.signIn.mockRejectedValue({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'private' });
    await expect(service.login(input)).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    client.getSession.mockRejectedValue({ status: 503 });
    await expect(service.getSession('cookie')).rejects.toMatchObject({ status: 503, retryable: true });
  });
});
