import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Sql } from 'postgres';
import type { Redis } from 'ioredis';
import { redisPlugin } from './shared/cache/redis.js';
import { loadEnv, type Env } from './shared/config/env.js';
import { databasePlugin } from './shared/database/client.js';
import { openapiPlugin } from './shared/docs/openapi.js';
import { registerErrorHandlers } from './shared/exceptions/error-handler.js';
import { rateLimitPlugin } from './shared/http/rate-limit.js';
import { securityPlugin } from './shared/http/security.js';
import { traceIdPlugin } from './shared/http/trace-id.js';
import { createLoggerOptions } from './shared/logging/logger.js';
import { healthRoutes } from './shared/observability/health.routes.js';
import { underPressurePlugin } from './shared/observability/under-pressure.js';

interface BuildAppOptions {
  env?: Env;
  sql?: Sql;
  redis?: Redis;
}

/** Builds the configured API, optionally accepting a validated environment and database client. */
export async function buildApp(options: BuildAppOptions = {}) {
  const env = options.env ?? loadEnv(process.env);
  const app = Fastify({ logger: createLoggerOptions(env), trustProxy: true, bodyLimit: 1_048_576 })
    .withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  try {
    await app.register(traceIdPlugin, { appVersion: env.APP_VERSION });
    await app.register(securityPlugin, { env });
    await app.register(openapiPlugin, { env });
    await app.register(underPressurePlugin);
    await app.register(databasePlugin, { env, sql: options.sql });
    await app.register(redisPlugin, { env, redis: options.redis });
    await app.register(rateLimitPlugin, { env });
    registerErrorHandlers(app);
    await app.register(healthRoutes, { env });
    await app.ready();
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
