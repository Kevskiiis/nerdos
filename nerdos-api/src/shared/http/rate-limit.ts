import rateLimit, { type RateLimitOptions } from '@fastify/rate-limit';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Redis } from 'ioredis';
import { buildRedisNamespace } from '../cache/redis-keys.js';
import type { Env } from '../config/env.js';
import { AppError } from '../exceptions/app-error.js';
import { ErrorCode } from '../exceptions/error-codes.js';

/** Determines the identifier used for a rate-limit bucket. */
export type RateLimitKeyStrategy = 'ip' | 'user' | ((req: FastifyRequest) => string);
/** Defines a named rate-limit tier and its bucket policy. */
export type RateLimitPolicyInput = { tier: string; max: number; timeWindow: string | number; keyBy?: RateLimitKeyStrategy };

/** Creates a reusable rate-limit policy for public or authenticated requests. */
export function createRateLimitPolicy({ tier, max, timeWindow, keyBy = 'ip' }: RateLimitPolicyInput): RateLimitOptions {
  return { max, timeWindow, keyGenerator: (req) => {
    const session = (req as FastifyRequest & { session?: { userId: string } | null }).session;
    const identifier = typeof keyBy === 'function' ? keyBy(req) : keyBy === 'user' ? session?.userId ?? req.ip : req.ip;
    return `${tier}:${identifier}`;
  } };
}

const unavailable = () => new AppError({ status: 503, code: ErrorCode.SERVICE_UNAVAILABLE, detail: 'Rate limiting service unavailable', retryable: true });
const limited = () => new AppError({ status: 429, code: ErrorCode.RATE_LIMITED, detail: 'Too many requests. Please try again later.' });

// The plugin's default Redis store prefixes per-route keys. This store keeps tiers
// shared across routes and converts every Redis failure at the store boundary.
function createStore(redis: Redis, namespace: string) {
  const client = redis as Redis & { nerdosRateLimit?: (key: string, window: number, callback: (err: Error | null, result?: [number, number]) => void) => void };
  if (!client.nerdosRateLimit) client.defineCommand('nerdosRateLimit', { numberOfKeys: 1, lua: `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
    return {current, redis.call('PTTL', KEYS[1])}
  ` });
  return class Store {
    incr(key: string, callback: (error: Error | null, result?: { current: number; ttl: number }) => void, timeWindow: number) {
      try {
        client.nerdosRateLimit!(namespace + key, timeWindow, (error, result) => {
          if (error || !result) callback(unavailable());
          else callback(null, { current: result[0], ttl: result[1] });
        });
      } catch { callback(unavailable()); }
    }
    child() { return this; }
  };
}

interface Options { env?: Pick<Env, 'NODE_ENV'> }
const plugin: FastifyPluginAsync<Options> = async (app, { env }) => {
  const namespace = buildRedisNamespace('rl', env?.NODE_ENV);
  await app.register(rateLimit, {
    redis: app.redis, nameSpace: namespace, store: createStore(app.redis, namespace), skipOnError: false,
    ...createRateLimitPolicy({ tier: 'global', max: 100, timeWindow: '1 minute', keyBy: 'ip' }),
    allowList: (request) => ['/health/live', '/health/ready'].includes(request.url.split('?')[0]),
    errorResponseBuilder: limited,
  });
  // createRateLimit does not use the plugin's per-request hook guard, so a
  // global onRequest limit and a per-user preHandler limit can both run.
  app.rateLimit = ((policy?: RateLimitOptions) => {
    const check = app.createRateLimit(policy);
    return async (request, reply) => {
      const result = await check(request);
      if (!result.isAllowed && result.isExceeded) {
        reply.header('retry-after', result.ttlInSeconds);
        throw limited();
      }
    };
  }) as typeof app.rateLimit;
};

/** Registers the shared fail-closed Redis rate limiter. */
export const rateLimitPlugin = fp(plugin, { name: 'rate-limit', dependencies: ['redis'] });
