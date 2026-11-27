import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { beforeEach, expect, it, vi } from 'vitest';
import { redisPlugin } from '../../../src/shared/cache/redis.js';

vi.mock('ioredis', () => ({ Redis: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const env = { REDIS_URL: 'rediss://user:pass@host:6379', NODE_ENV: 'test' as const, REDIS_CA_CERT: 'certificate' };

it('creates a TLS fail-fast client without a key prefix and quits on close', async () => {
  const client = { on: vi.fn(), quit: vi.fn().mockResolvedValue('OK'), disconnect: vi.fn() };
  vi.mocked(Redis).mockImplementationOnce(function () { return client as unknown as Redis; });
  const app = Fastify();
  await app.register(redisPlugin, { env });
  expect(Redis).toHaveBeenCalledWith(env.REDIS_URL, expect.objectContaining({
    tls: { rejectUnauthorized: true, ca: 'certificate' }, connectTimeout: 2000, commandTimeout: 1500,
    maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true, enableReadyCheck: true,
    keepAlive: 15000, db: 0, connectionName: 'nerdos-api-test',
  }));
  const options = vi.mocked(Redis).mock.calls[0][1]!;
  expect(options).not.toHaveProperty('keyPrefix');
  expect(options.retryStrategy!(100)).toBe(5000);
  expect(app.redis).toBe(client);
  await app.close();
  expect(client.quit).toHaveBeenCalledOnce();
});

it('logs errors without credentials and disconnects when quit fails', async () => {
  const client = { on: vi.fn(), quit: vi.fn().mockRejectedValue(new Error('offline')), disconnect: vi.fn() };
  const app = Fastify();
  const log = vi.spyOn(app.log, 'error');
  await app.register(redisPlugin, { env, redis: client as unknown as Redis });
  const listener = client.on.mock.calls[0][1] as (error: Error) => void;
  listener(new Error(`failed ${env.REDIS_URL}`));
  expect(JSON.stringify(log.mock.calls)).not.toContain('pass');
  expect(log).toHaveBeenCalledOnce();
  await app.close();
  expect(client.disconnect).toHaveBeenCalledOnce();
});
