import type { Sql } from 'postgres';
import type { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/shared/config/env.js';
import { errorResponseSchema } from '../src/shared/exceptions/error-schema.js';

const env = loadEnv({ REDIS_URL: 'redis://localhost:6379', NODE_ENV: 'test', LOG_LEVEL: 'silent', DATABASE_URL: 'postgresql://localhost/test', CLIENT_ORIGIN: 'https://example.com' });
const query = Object.assign(Promise.resolve([]), { cancel: vi.fn().mockResolvedValue(undefined) });
const sql = Object.assign(vi.fn(() => query), { end: vi.fn().mockResolvedValue(undefined) });
const redis = { status: 'ready', ping: vi.fn().mockResolvedValue('PONG'), quit: vi.fn().mockResolvedValue('OK'), disconnect: vi.fn() };
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => { app = await buildApp({ env, sql: sql as unknown as Sql, redis: redis as unknown as Redis }); });
afterAll(async () => { await app.close(); });

describe('buildApp', () => {
  it('serves liveness with trace, version, and security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['x-trace-id']).toBeTruthy();
    expect(response.headers['x-app-version']).toBe(env.APP_VERSION);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.json()).toMatchObject({ status: 'ok', version: env.APP_VERSION, commit: env.APP_COMMIT });
  });

  it('uses the injected pool for readiness', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', latency_ms: expect.any(Number) });
    expect(sql).toHaveBeenCalledOnce();
    expect(redis.ping).toHaveBeenCalledOnce();
  });

  it('returns the unified not-found contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/missing', headers: { 'x-trace-id': 'integration-trace' } });
    expect(response.statusCode).toBe(404);
    expect(errorResponseSchema.parse(response.json())).toMatchObject({ status: 404, code: 'NOT_FOUND', trace_id: 'integration-trace' });
  });

  it('documents registered health routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(response.statusCode).toBe(200);
    expect(response.json().paths).toHaveProperty('/health/live');
    expect(response.json().paths).toHaveProperty('/health/ready');
  });

  it('closes the application and database client cleanly', async () => {
    await app.close();
    expect(sql.end).toHaveBeenCalledOnce();
    expect(redis.quit).toHaveBeenCalledOnce();
    expect(sql.end).toHaveBeenCalledWith({ timeout: 5 });
  });
});
