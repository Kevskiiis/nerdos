import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import postgres, { type Sql } from 'postgres';
import type { Env } from '../config/env.js';

interface DatabaseOptions {
  env: Pick<Env, 'DATABASE_URL'>;
  sql?: Sql;
}

const plugin: FastifyPluginAsync<DatabaseOptions> = async (app, { env, sql }) => {
  const client = sql ?? postgres(env.DATABASE_URL, { max: 10, idle_timeout: 20, prepare: false });
  app.decorate('sql', client);
  app.addHook('onClose', async () => { await client.end({ timeout: 5 }); });
};

/** Registers a shared PostgreSQL pool and closes it when the application shuts down. */
export const databasePlugin = fp(plugin, { name: 'database' });
