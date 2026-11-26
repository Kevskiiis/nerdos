import type { FastifyServerOptions } from 'fastify';
import type { Env } from '../config/env.js';

/** Creates Pino settings with release metadata, sensitive-field redaction, and development formatting. */
export function createLoggerOptions(env: Env): Exclude<NonNullable<FastifyServerOptions['logger']>, boolean> {
  return {
    level: env.LOG_LEVEL,
    base: {
      app_name: env.APP_NAME,
      app_version: env.APP_VERSION,
      app_commit: env.APP_COMMIT,
      app_release: env.APP_RELEASE,
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      censor: '[Redacted]',
    },
    ...(env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {}),
  };
}
