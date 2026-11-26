import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { beforeEach, expect, it, vi } from 'vitest';
import { redisPlugin } from '../../../src/shared/cache/redis.js';

vi.mock('ioredis', () => ({ Redis: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

it('creates a fail-fast client without a key prefix, connects, and quits on close', async () => {
  const client = { status: 'ready', on: vi.fn(), connect: vi.fn().mockResolvedValue(undefined), quit: vi.fn().mockResolvedValue('OK'), disconnect: vi.fn() };
  vi.mocked(Redis).mockImplementationOnce(function () { return client as unknown as Redis; });
  const app = Fastify();
  try {
    await app.register(redisPlugin, { env: { REDIS_URL: 'redis://localhost:6379' } });
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', { connectTimeout: 2000, commandTimeout: 2000, maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true });
    expect(app.redis).toBe(client);
    expect(client.connect).toHaveBeenCalledOnce();
  } finally {
    await app.close();
  }
  expect(client.quit).toHaveBeenCalledOnce();
});

it('disconnects instead of quitting when the client is offline', async () => {
  const client = { status: 'reconnecting', quit: vi.fn(), disconnect: vi.fn() };
  const app = Fastify();
  await app.register(redisPlugin, { env: { REDIS_URL: 'redis://localhost:6379' }, redis: client as unknown as Redis });
  await app.close();
  expect(client.quit).not.toHaveBeenCalled();
  expect(client.disconnect).toHaveBeenCalledOnce();
});

it('disconnects when quit fails', async () => {
  const client = { status: 'ready', quit: vi.fn().mockRejectedValue(new Error('offline')), disconnect: vi.fn() };
  const app = Fastify();
  await app.register(redisPlugin, { env: { REDIS_URL: 'redis://localhost:6379' }, redis: client as unknown as Redis });
  await app.close();
  expect(client.disconnect).toHaveBeenCalledOnce();
});
