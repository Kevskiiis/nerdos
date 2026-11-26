import Fastify from 'fastify';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { registerErrorHandlers } from '../../../src/shared/exceptions/error-handler.js';
import { errorResponseSchema } from '../../../src/shared/exceptions/error-schema.js';
import { traceIdPlugin } from '../../../src/shared/http/trace-id.js';
import { underPressurePlugin } from '../../../src/shared/observability/under-pressure.js';

const app = Fastify();

beforeAll(async () => {
  await app.register(traceIdPlugin);
  await app.register(underPressurePlugin, { maxHeapUsedBytes: 1, sampleInterval: 10 });
  registerErrorHandlers(app);
  app.get('/', async () => ({ ok: true }));
  await app.ready();
});

afterAll(async () => { await app.close(); });

it('returns a retryable 503 using the shared error contract under pressure', async () => {
  await expect.poll(() => app.isUnderPressure(), { interval: 10, timeout: 2000 }).toBe(true);
  const response = await app.inject({ method: 'GET', url: '/', headers: { 'x-trace-id': 'pressure-trace' } });
  expect(response.statusCode).toBe(503);
  expect(response.headers['retry-after']).toBeTruthy();
  expect(errorResponseSchema.parse(response.json())).toMatchObject({
    status: 503, code: 'SERVICE_UNAVAILABLE', detail: 'Service temporarily unavailable',
    trace_id: 'pressure-trace', retryable: true,
  });
});
