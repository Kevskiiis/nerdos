import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { Sql } from 'postgres';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { databasePlugin } from '../../../src/shared/database/client.js';
import { healthRoutes } from '../../../src/shared/observability/health.routes.js';
import { underPressurePlugin } from '../../../src/shared/observability/under-pressure.js';

const apps: FastifyInstance[] = [];
const env = { DATABASE_URL: 'postgresql://localhost/test', APP_VERSION: '1.2.3', APP_COMMIT: 'abc1234' };

function mockSql(result: Promise<unknown>) {
  const query = Object.assign(result, { cancel: vi.fn().mockResolvedValue(undefined) });
  const sql = Object.assign(vi.fn(() => query), { end: vi.fn().mockResolvedValue(undefined) });
  return { sql, query };
}

async function makeApp(sql: ReturnType<typeof mockSql>['sql'], timeoutMs = 1000, pressure = false) {
  const app = Fastify();
  apps.push(app);
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  if (pressure) await app.register(underPressurePlugin, { maxHeapUsedBytes: 1, sampleInterval: 10 });
  await app.register(databasePlugin, { env, sql: sql as unknown as Sql });
  await app.register(healthRoutes, { env, timeoutMs });
  await app.ready();
  return app;
}

afterAll(async () => { await Promise.all(apps.map((app) => app.close())); });

describe('health routes', () => {
  it('returns liveness without querying the database', async () => {
    const { sql } = mockSql(Promise.resolve([]));
    const app = await makeApp(sql);
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', version: '1.2.3', commit: 'abc1234', uptime_seconds: expect.any(Number), timestamp: expect.any(String) });
    expect(sql).not.toHaveBeenCalled();
  });

  it('keeps liveness available under pressure', async () => {
    const { sql } = mockSql(Promise.resolve([]));
    const app = await makeApp(sql, 1000, true);
    await expect.poll(() => app.isUnderPressure(), { interval: 10, timeout: 2000 }).toBe(true);
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');
  });

  it('returns ready after a successful database query', async () => {
    const { sql } = mockSql(Promise.resolve([]));
    const app = await makeApp(sql);
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', latency_ms: expect.any(Number) });
    expect(sql).toHaveBeenCalledOnce();
    expect(sql.mock.calls[0][0][0]).toBe('SELECT 1');
  });

  it('returns degraded when the database rejects the query', async () => {
    const { sql } = mockSql(Promise.reject(new Error('database unavailable')));
    const app = await makeApp(sql);
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'degraded' });
  });

  it('times out and cancels a stalled readiness query', async () => {
    const { sql, query } = mockSql(new Promise(() => {}));
    const app = await makeApp(sql, 20);
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'degraded' });
    expect(query.cancel).toHaveBeenCalledOnce();
  });

  it('closes the injected pool once on app shutdown', async () => {
    const { sql } = mockSql(Promise.resolve([]));
    const app = await makeApp(sql);
    await app.close();
    expect(sql.end).toHaveBeenCalledOnce();
    expect(sql.end).toHaveBeenCalledWith({ timeout: 5 });
  });
});
