import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../../src/shared/config/env.js';
import { createLoggerOptions } from '../../../src/shared/logging/logger.js';

const required = { NEON_AUTH_BASE_URL: 'https://auth.example.com', NEON_AUTH_COOKIE_SECRET: 'test-secret-at-least-32-characters-long', REDIS_URL: 'rediss://user:pass@localhost:6379', DATABASE_URL: 'postgresql://user:password@localhost:5432/nerdos', CLIENT_ORIGIN: 'https://example.com' };

describe('createLoggerOptions', () => {
  it('includes release metadata and redaction paths', () => {
    const env = loadEnv({ ...required, NODE_ENV: 'test' });
    const options = createLoggerOptions(env);
    expect(options.base).toMatchObject({ app_name: env.APP_NAME, app_version: env.APP_VERSION, app_commit: env.APP_COMMIT, app_release: env.APP_RELEASE });
    expect(options.redact).toMatchObject({ paths: expect.arrayContaining(['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token']) });
  });

  it.each(['production', 'test'] as const)('omits pretty transport in %s', (NODE_ENV) => {
    expect(createLoggerOptions(loadEnv({ ...required, NODE_ENV })).transport).toBeUndefined();
  });

  it('uses pino-pretty in development', () => {
    expect(createLoggerOptions(loadEnv({ ...required, NODE_ENV: 'development' })).transport).toMatchObject({ target: 'pino-pretty' });
  });
});
