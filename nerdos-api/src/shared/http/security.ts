import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

interface SecurityOptions {
  env: Pick<Env, 'CLIENT_ORIGIN'>;
}

const plugin: FastifyPluginAsync<SecurityOptions> = async (app, { env }) => {
  await app.register(sensible);
  await app.register(helmet);
  await app.register(cors, { origin: env.CLIENT_ORIGIN, credentials: true });
};

/** Registers shared HTTP error helpers, security headers, and credentialed CORS. */
export const securityPlugin = fp(plugin, { name: 'security' });
