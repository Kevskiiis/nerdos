import Fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { traceIdPlugin } from '../../../src/shared/http/trace-id.js';
import { AppError } from '../../../src/shared/exceptions/app-error.js';
import { ErrorCode } from '../../../src/shared/exceptions/error-codes.js';
import { registerErrorHandlers } from '../../../src/shared/exceptions/error-handler.js';
import { errorResponseSchema } from '../../../src/shared/exceptions/error-schema.js';

const app = Fastify();

beforeAll(async () => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(traceIdPlugin);
  registerErrorHandlers(app);
  app.get('/auth', async () => { throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, detail: 'Sign in', meta_data: { reason: 'expired' } }); });
  app.get('/missing', async () => { throw new AppError({ status: 404, code: ErrorCode.NOT_FOUND, detail: 'Account not found' }); });
  app.get('/unexpected', async () => { throw new Error('private secret'); });
  app.get('/direct-validation', async () => { z.object({ name: z.string() }).parse({ name: 42 }); });
  app.post('/validate', { schema: { body: z.object({ name: z.string().min(1) }) } }, async () => ({ ok: true }));
  await app.ready();
});

afterAll(async () => { await app.close(); });

describe('error handlers', () => {
  it.each([
    ['/auth', 401, 'UNAUTHORIZED', 'Sign in'],
    ['/missing', 404, 'NOT_FOUND', 'Account not found'],
    ['/unknown?secret=value', 404, 'NOT_FOUND', 'Resource not found'],
    ['/unexpected', 500, 'INTERNAL_ERROR', 'Internal server error'],
  ] as const)('normalizes %s', async (url, status, code, detail) => {
    const response = await app.inject({ method: 'GET', url, headers: { 'x-trace-id': 'test-trace' } });
    const body = errorResponseSchema.parse(response.json());
    expect(response.statusCode).toBe(status);
    expect(body).toMatchObject({ status, code, detail, instance: url.split('?')[0], trace_id: 'test-trace', retryable: false });
    expect(JSON.stringify(body)).not.toContain('private secret');
    if (url === '/auth') expect(body.meta_data).toEqual({ reason: 'expired' });
  });

  it('normalizes Zod request validation with field errors', async () => {
    const response = await app.inject({ method: 'POST', url: '/validate', payload: { name: '' } });
    const body = errorResponseSchema.parse(response.json());
    expect(response.statusCode).toBe(422);
    expect(body).toMatchObject({ code: 'VALIDATION_ERROR', meta_data: { field_errors: [{ path: '/name', message: expect.any(String) }] } });
  });

  it('normalizes a directly thrown Zod error', async () => {
    const response = await app.inject({ method: 'GET', url: '/direct-validation' });
    const body = errorResponseSchema.parse(response.json());
    expect(response.statusCode).toBe(422);
    expect(body.meta_data).toMatchObject({ field_errors: [{ path: 'name', message: expect.any(String) }] });
  });

  it('normalizes Fastify client errors', async () => {
    const response = await app.inject({ method: 'POST', url: '/validate', headers: { 'content-type': 'application/json' }, payload: '{' });
    const body = errorResponseSchema.parse(response.json());
    expect(response.statusCode).toBe(400);
    expect(body.code).toBe('BAD_REQUEST');
  });
});
