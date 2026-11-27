import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../../src/shared/config/env.js';
import { buildMetadata } from '../../../src/shared/config/version.js';

const required = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/nerdos',
  REDIS_URL: 'rediss://user:pass@localhost:6379',
  CLIENT_ORIGIN: 'https://example.com',
};

describe('loadEnv', () => {
  it('parses a complete configuration and adds build metadata', () => {
    const env = loadEnv({ ...required, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '8080', LOG_LEVEL: 'warn' });
    expect(env).toEqual({ ...required, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: 8080, LOG_LEVEL: 'warn', ...buildMetadata });
  });

  it('supplies defaults for optional fields', () => {
    expect(loadEnv(required)).toMatchObject({ NODE_ENV: 'development', HOST: '0.0.0.0', PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('reports missing required fields', () => {
    expect(() => loadEnv({})).toThrow(/CLIENT_ORIGIN.*REDIS_URL.*DATABASE_URL/);
    expect(() => loadEnv({ ...required, REDIS_URL: '' })).toThrow(/REDIS_URL/);
  });

  it.each(['redis://user:pass@host:6379', 'rediss://:pass@host:6379', 'rediss://user@host:6379', 'invalid'])('rejects insecure Redis URL %s', (url) => {
    expect(() => loadEnv({ ...required, REDIS_URL: url })).toThrow(/REDIS_URL/);
  });

  it('accepts TLS Redis credentials and normalizes a custom CA certificate', () => {
    expect(loadEnv({ ...required, REDIS_CA_CERT: 'first\\nsecond' })).toMatchObject({ REDIS_CA_CERT: 'first\nsecond' });
  });

  it.each([
    { ...required, DATABASE_URL: 'https://example.com' },
    { ...required, CLIENT_ORIGIN: 'not-a-url' },
    { ...required, CLIENT_ORIGIN: 'https://example.com/path' },
    { ...required, PORT: '0' },
    { ...required, LOG_LEVEL: 'invalid' },
  ])('rejects invalid configuration', (rawEnv) => {
    expect(() => loadEnv(rawEnv)).toThrow('Invalid environment configuration');
  });
});
