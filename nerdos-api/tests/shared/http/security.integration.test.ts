import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { securityPlugin } from '../../../src/shared/http/security.js';

const app = Fastify();
const origin = 'https://client.example.com';

beforeAll(async () => {
  await app.register(securityPlugin, { env: { CLIENT_ORIGIN: origin } });
  app.get('/', async () => ({ ok: true }));
  await app.ready();
});

afterAll(async () => { await app.close(); });

describe('securityPlugin', () => {
  it('sets security headers and allows the configured origin with credentials', async () => {
    const response = await app.inject({ method: 'GET', url: '/', headers: { origin } });
    expect(response.statusCode).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorize a different origin', async () => {
    const response = await app.inject({ method: 'GET', url: '/', headers: { origin: 'https://other.example.com' } });
    expect(response.headers['access-control-allow-origin']).not.toBe('https://other.example.com');
  });

  it('answers a CORS preflight for the configured origin', async () => {
    const response = await app.inject({ method: 'OPTIONS', url: '/', headers: { origin, 'access-control-request-method': 'POST' } });
    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
