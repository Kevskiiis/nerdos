import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNeonAuthClient, normalizeCrossSiteCookies } from '../../../src/modules/authentication/auth.client.js';

const env = { NEON_AUTH_BASE_URL: 'https://auth.example.com/api/auth', NEON_AUTH_COOKIE_SECRET: 'x'.repeat(32), CLIENT_ORIGIN: 'https://client.example.com' };
afterEach(() => vi.unstubAllGlobals());

describe('normalizeCrossSiteCookies', () => {
  it('sets required attributes once, preserves expiry and works on multiple cookies', () => {
    const cookies = normalizeCrossSiteCookies([
      'session=abc; SameSite=Lax; Secure; HttpOnly; Path=/old; Max-Age=0; Expires=Wed, 21 Oct 2015 07:28:00 GMT; SameSite=Strict',
      'other=value; Domain=example.com',
    ]);
    expect(cookies).toEqual([
      'session=abc; Max-Age=0; Expires=Wed, 21 Oct 2015 07:28:00 GMT; SameSite=None; Secure; HttpOnly; Path=/',
      'other=value; Domain=example.com; SameSite=None; Secure; HttpOnly; Path=/',
    ]);
    expect(normalizeCrossSiteCookies(cookies)).toEqual(cookies);
  });
});

describe('Neon Auth adapter', () => {
  it('sends the supplied full name to Neon signup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ user: { id: 'u', email: 'u@example.com', name: 'First Last', emailVerified: false } }));
    vi.stubGlobal('fetch', fetchMock);
    await createNeonAuthClient(env).signUp({ name: 'First Last', email: 'u@example.com', password: 'long-password' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/sign-up/email');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: 'First Last', email: 'u@example.com', password: 'long-password' });
  });
  it('forwards login cookies with cross-site attributes and maps the user', async () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append('set-cookie', 'session=abc; Path=/auth; SameSite=Lax');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: 'u', email: 'u@example.com', emailVerified: true } }), { headers })));
    const result = await createNeonAuthClient(env).signIn({ email: 'u@example.com', password: 'long-password' });
    expect(result.data.user.id).toBe('u');
    expect(result.setCookies).toEqual(['session=abc; SameSite=None; Secure; HttpOnly; Path=/']);
  });
  it('passes isolated request cookies and bypasses the SDK session cache', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const cookie = new Headers(init?.headers).get('cookie');
      return Response.json({ session: { id: `session-${cookie}`, userId: `user-${cookie}`, expiresAt: '2099-01-01T00:00:00.000Z' }, user: { id: `user-${cookie}`, email: 'user@example.com', emailVerified: true } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = createNeonAuthClient(env);
    const results = await Promise.all([client.getSession('a=1'), client.getSession('b=2')]);
    expect(results).toEqual([
      { sessionId: 'session-a=1', userId: 'user-a=1', expiresAt: '2099-01-01T00:00:00.000Z' },
      { sessionId: 'session-b=2', userId: 'user-b=2', expiresAt: '2099-01-01T00:00:00.000Z' },
    ]);
    for (const call of fetchMock.mock.calls) expect(String(call[0])).toContain('disableCookieCache=true');
  });
  it('sends OTP password resets to the Better Auth endpoint and propagates failures', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ success: true })).mockResolvedValueOnce(Response.json({ code: 'INVALID_OTP' }, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createNeonAuthClient(env);
    const input = { email: 'user@example.com', code: '123456', newPassword: 'long-password' };
    expect(await client.resetPassword(input)).toEqual({ data: { success: true }, setCookies: [] });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://auth.example.com/api/auth/email-otp/reset-password');
    expect(JSON.parse(options.body)).toEqual({ email: input.email, otp: input.code, password: input.newPassword });
    await expect(client.resetPassword(input)).rejects.toMatchObject({ status: 400, body: { code: 'INVALID_OTP' } });
  });
  it('propagates upstream session errors instead of treating outages as signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'unavailable' }, { status: 503 })));
    await expect(createNeonAuthClient(env).getSession('a=1')).rejects.toMatchObject({ status: 503 });
  });
});
