import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { openapiPlugin } from '../../../src/shared/docs/openapi.js';

const app = Fastify();
const productionApp = Fastify();

beforeAll(async () => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(openapiPlugin, { env: { NODE_ENV: 'test', APP_NAME: 'Test API', APP_VERSION: '2.3.4' } });
  app.get('/example', { schema: { response: { 200: z.object({ message: z.string() }) } } }, async () => ({ message: 'ok' }));
  await productionApp.register(openapiPlugin, { env: { NODE_ENV: 'production', APP_NAME: 'Test API', APP_VERSION: '2.3.4' } });
  await Promise.all([app.ready(), productionApp.ready()]);
});

afterAll(async () => { await Promise.all([app.close(), productionApp.close()]); });

describe('openapiPlugin', () => {
  it('serves an OpenAPI document with the application version and Zod route schema', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(response.statusCode).toBe(200);
    const spec = response.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info).toMatchObject({ title: 'Test API', version: '2.3.4' });
    expect(spec.paths['/example'].get.responses['200'].content['application/json'].schema).toMatchObject({ type: 'object', properties: { message: { type: 'string' } } });
  });

  it('serves the documentation UI outside production', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it.each(['/docs', '/docs/', '/docs/json'])('does not expose %s in production', async (url) => {
    expect((await productionApp.inject({ method: 'GET', url })).statusCode).toBe(404);
  });
});
