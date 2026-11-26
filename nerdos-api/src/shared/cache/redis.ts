import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

interface RedisOptions {
  env: Pick<Env, 'REDIS_URL'>;
  redis?: Redis;
}

const plugin: FastifyPluginAsync<RedisOptions> = async (app, { env, redis }) => {
  const client = redis ?? new Redis(env.REDIS_URL, {
    connectTimeout: 2000,
    commandTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  app.decorate('redis', client);
  app.addHook('onClose', async () => {
    if (client.status === 'ready') {
      try {
        await client.quit();
      } catch {
        client.disconnect();
      }
    } else {
      client.disconnect();
    }
  });

  if (!redis) {
    client.on('error', () => app.log.warn('Redis connection error'));
    void client.connect().catch(() => app.log.warn('Redis initial connection failed'));
  }
};

/** Registers a fail-fast Redis client and closes it with the application. */
export const redisPlugin = fp(plugin, { name: 'redis' });
