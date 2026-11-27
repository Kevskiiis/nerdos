import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { traceIdPlugin } from '../../../src/shared/http/trace-id.js';

const app = Fastify();

beforeAll(async () => {
  await app.register(traceIdPlugin, { appVersion: '1.2.3' });
  app.get('/', async (request) => ({ traceId: request.traceId }));
  await app.ready();
});

afterAll(async () => { await app.close(); });

describe('traceIdPlugin', () => {
  it('generates a trace ID and exposes it on the request and response', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['x-trace-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/);
    expect(response.json().traceId).toBe(response.headers['x-trace-id']);
    expect(response.headers['x-app-version']).toBe('1.2.3');
  });

  it('preserves a client trace ID', async () => {
    const response = await app.inject({ method: 'GET', url: '/', headers: { 'x-trace-id': 'client-trace-123' } });
    expect(response.headers['x-trace-id']).toBe('client-trace-123');
    expect(response.json().traceId).toBe('client-trace-123');
  });

  it('generates a trace ID for an empty header', async () => {
    const response = await app.inject({ method: 'GET', url: '/', headers: { 'x-trace-id': '' } });
    expect(response.headers['x-trace-id']).toBeTruthy();
    expect(response.json().traceId).toBe(response.headers['x-trace-id']);
  });
});

it('binds the trace ID to request logs and redacts secrets', async () => {
  const { Writable } = await import('node:stream');
  const { loadEnv } = await import('../../../src/shared/config/env.js');
  const { createLoggerOptions } = await import('../../../src/shared/logging/logger.js');
  const lines: string[] = [];
  const stream = new Writable({ write(chunk, _encoding, callback) { lines.push(chunk.toString()); callback(); } });
  const env = loadEnv({ NODE_ENV: 'test', REDIS_URL: 'rediss://user:pass@localhost:6379', DATABASE_URL: 'postgresql://localhost/test', CLIENT_ORIGIN: 'https://example.com' });
  const loggedApp = Fastify({ logger: { ...createLoggerOptions(env), stream, serializers: { req: (value) => value } } });
  try {
    await loggedApp.register(traceIdPlugin);
    loggedApp.get('/', async (request) => {
      request.log.info({ req: { headers: request.headers }, user: { password: 'secret', token: 'secret-token' } }, 'request event');
      return { ok: true };
    });
    await loggedApp.inject({ method: 'GET', url: '/', headers: { 'x-trace-id': 'trace-log', authorization: 'Bearer secret', cookie: 'session=secret' } });
    const event = lines.map((line) => JSON.parse(line)).find((line) => line.msg === 'request event');
    expect(event.trace_id).toBe('trace-log');
    expect(event.req.headers.authorization).toBe('[Redacted]');
    expect(event.req.headers.cookie).toBe('[Redacted]');
    expect(event.user).toEqual({ password: '[Redacted]', token: '[Redacted]' });
  } finally {
    await loggedApp.close();
  }
});
