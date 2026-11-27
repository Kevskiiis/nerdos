import Fastify from 'fastify';
import type { Redis } from 'ioredis';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { redisPlugin } from '../../../src/shared/cache/redis.js';
import { registerErrorHandlers } from '../../../src/shared/exceptions/error-handler.js';
import { errorResponseSchema } from '../../../src/shared/exceptions/error-schema.js';
import { createRateLimitPolicy, rateLimitPlugin } from '../../../src/shared/http/rate-limit.js';

async function setup() {
  const counts = new Map<string, number>();
  const redis = {
    on: vi.fn(), quit: vi.fn().mockResolvedValue('OK'), disconnect: vi.fn(), defineCommand: vi.fn(),
    nerdosRateLimit: vi.fn((key: string, window: number, callback: (error: Error | null, result?: number[]) => void) => {
      const count = (counts.get(key) ?? 0) + 1; counts.set(key, count); callback(null, [count, window]);
    }),
  };
  const app = Fastify();
  await app.register(redisPlugin, { env: { NODE_ENV: 'test', REDIS_URL: 'rediss://user:pass@host' }, redis: redis as unknown as Redis });
  await app.register(rateLimitPlugin, { env: { NODE_ENV: 'test' } });
  registerErrorHandlers(app);
  app.get('/global', async () => ({ ok: true }));
  const policy = createRateLimitPolicy({ tier: 'public', max: 1, timeWindow: '1 minute' });
  app.get('/public', { config: { rateLimit: policy } }, async () => ({ ok: true }));
  app.get('/public-other', { config: { rateLimit: policy } }, async () => ({ ok: true }));
  app.get('/protected', { preHandler: [async (request) => {
    (request as typeof request & { session: { userId: string } }).session = { userId: String(request.headers['x-user']) };
  }, app.rateLimit(createRateLimitPolicy({ tier: 'user', max: 1, timeWindow: '1 minute', keyBy: 'user' }))] }, async () => ({ ok: true }));
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async () => ({ status: 'ok' }));
  await app.ready();
  return { app, redis, counts };
}
let close: (() => Promise<void>) | undefined;
afterEach(async () => { await close?.(); close = undefined; });

describe('Redis rate limiting', () => {
  it('enforces the global limit with the standard error schema', async () => {
    const { app, counts } = await setup(); close = () => app.close();
    for (let i = 0; i < 100; i++) expect((await app.inject('/global')).statusCode).toBe(200);
    const response = await app.inject('/global');
    expect(response.statusCode).toBe(429);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'RATE_LIMITED', retryable: false });
    expect(counts.get('nerdos:test:rl:global:127.0.0.1')).toBe(101);
  });
  it('shares a public tier across routes and isolates it from the global bucket', async () => {
    const { app, counts } = await setup(); close = () => app.close();
    expect((await app.inject('/global')).statusCode).toBe(200);
    expect((await app.inject('/public')).statusCode).toBe(200);
    expect((await app.inject('/public-other')).statusCode).toBe(429);
    expect(counts.get('nerdos:test:rl:public:127.0.0.1')).toBe(2);
  });
  it('runs both global and authenticated per-user limits', async () => {
    const { app, counts } = await setup(); close = () => app.close();
    const inject = (user: string) => app.inject({ url: '/protected', headers: { 'x-user': user } });
    expect((await inject('one')).statusCode).toBe(200);
    expect((await inject('one')).statusCode).toBe(429);
    expect((await inject('two')).statusCode).toBe(200);
    expect(counts.get('nerdos:test:rl:global:127.0.0.1')).toBe(3);
    expect(counts.get('nerdos:test:rl:user:one')).toBe(2);
  });
  it('fails closed for any store error while exempting probes', async () => {
    const { app, redis } = await setup(); close = () => app.close();
    redis.nerdosRateLimit.mockImplementation((_key, _window, callback) => callback(new Error('Command timed out')));
    const response = await app.inject('/global');
    expect(response.statusCode).toBe(503);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ code: 'SERVICE_UNAVAILABLE', retryable: true });
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    expect((await app.inject('/health/ready?probe=1')).statusCode).toBe(200);
    expect(redis.nerdosRateLimit).toHaveBeenCalledOnce();
  });
});
