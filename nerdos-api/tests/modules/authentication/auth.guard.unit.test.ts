import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequireAuth } from '../../../src/modules/authentication/auth.guard.js';
import { registerErrorHandlers } from '../../../src/shared/exceptions/error-handler.js';

async function setup(session: unknown, error?: Error) {
  const app = Fastify();
  const getSession = vi.fn().mockImplementation(async () => { if (error) throw error; return session; });
  app.decorateRequest('session', null);
  registerErrorHandlers(app);
  app.get('/', { preHandler: createRequireAuth(getSession) }, async (request) => ({ session: request.session, hasUser: 'user' in request }));
  await app.ready();
  return { app, getSession };
}
let close: (() => Promise<void>) | undefined;
afterEach(async () => { await close?.(); close = undefined; });

describe('requireAuth', () => {
  it('attaches only a validated session', async () => {
    const session = { sessionId: 's', userId: 'u', expiresAt: '2099-01-01T00:00:00.000Z', ignored: 'private' };
    const { app, getSession } = await setup(session); close = () => app.close();
    const response = await app.inject({ url: '/', headers: { cookie: 'session=abc' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ session: { sessionId: 's', userId: 'u', expiresAt: session.expiresAt }, hasUser: false });
    expect(getSession).toHaveBeenCalledWith('session=abc');
  });
  it('rejects a missing cookie without calling the session provider', async () => {
    const { app, getSession } = await setup(null); close = () => app.close();
    expect((await app.inject('/')).json()).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(getSession).not.toHaveBeenCalled();
  });
  it.each([null, { sessionId: 's', userId: '', expiresAt: '2099-01-01T00:00:00.000Z' }, { sessionId: 's', userId: 'u', expiresAt: '2000-01-01T00:00:00.000Z' }])('rejects missing, invalid, or expired sessions', async (session) => {
    const { app } = await setup(session); close = () => app.close();
    expect((await app.inject({ url: '/', headers: { cookie: 'session=abc' } })).json()).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
  });
  it('propagates provider outages', async () => {
    const { app } = await setup(null, new Error('offline')); close = () => app.close();
    expect((await app.inject({ url: '/', headers: { cookie: 'session=abc' } })).statusCode).toBe(500);
  });
});
