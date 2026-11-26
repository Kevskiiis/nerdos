import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Env } from '../config/env.js';

interface HealthOptions {
  env: Pick<Env, 'APP_VERSION' | 'APP_COMMIT'>;
  timeoutMs?: number;
}

const livenessSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  commit: z.string(),
  uptime_seconds: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
});
const readinessSchema = z.object({ status: z.literal('ok'), latency_ms: z.number().nonnegative() });
const degradedSchema = z.object({ status: z.literal('degraded') });

/** Registers liveness and timeout-bounded database readiness probes. */
export const healthRoutes: FastifyPluginAsync<HealthOptions> = async (app, { env, timeoutMs = 1000 }) => {
  app.get('/health/live', {
    schema: { response: { 200: livenessSchema } },
    config: { pressureHandler: () => undefined },
  }, async () => ({
    status: 'ok' as const,
    version: env.APP_VERSION,
    commit: env.APP_COMMIT,
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', { schema: { response: { 200: readinessSchema, 503: degradedSchema } } }, async (_request, reply) => {
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let query: ReturnType<typeof app.sql> | undefined;
    let queryFinished = false;
    try {
      query = app.sql`SELECT 1`;
      const databaseCheck = Promise.resolve(query).then(() => { queryFinished = true; });
      await Promise.race([
        Promise.all([databaseCheck, Promise.resolve().then(() => app.redis.ping()).then((response) => {
          if (response !== 'PONG') throw new Error('Unexpected Redis ping response');
        })]),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Readiness check timed out')), timeoutMs);
        }),
      ]);
      return { status: 'ok' as const, latency_ms: performance.now() - started };
    } catch {
      if (query && !queryFinished) void query.cancel().catch(() => {});
      return reply.status(503).send({ status: 'degraded' as const });
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  });
};
