import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

interface RedisOptions {
  env: Pick<Env, 'REDIS_URL' | 'NODE_ENV'> & Partial<Pick<Env, 'REDIS_CA_CERT'>>;
  redis?: Redis;
}

const plugin: FastifyPluginAsync<RedisOptions> = async (app, { env, redis }) => {
  const client = redis ?? new Redis(env.REDIS_URL, {
    tls: { rejectUnauthorized: true, ...(env.REDIS_CA_CERT ? { ca: env.REDIS_CA_CERT } : {}) },
    connectTimeout: 2000,
    commandTimeout: 1500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    enableReadyCheck: true,
    keepAlive: 15000,
    db: 0,
    connectionName: `nerdos-api-${{ development: 'dev', test: 'test', production: 'prod' }[env.NODE_ENV]}`,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
  client.on('error', (err) => {
    // Redis error messages can contain connection credentials; never emit them verbatim.
    app.log.error({ name: err.name, message: 'Redis client error', code: (err as NodeJS.ErrnoException).code }, 'Redis error');
  });
  app.decorate('redis', client);
  app.addHook('onClose', async () => {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  });
};

/** Registers a fail-fast Redis client and closes it with the application. */
export const redisPlugin = fp(plugin, { name: 'redis' });
