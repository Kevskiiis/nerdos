import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../../shared/config/env.js';
import { createNeonAuthClient, type AuthClient } from './auth.client.js';
import { createRequireAuth } from './auth.guard.js';
import { authRoutes } from './auth.routes.js';
import { createAuthService } from './auth.service.js';

interface Options { env: Env; authClient?: AuthClient }
const plugin: FastifyPluginAsync<Options> = async (app, { env, authClient }) => {
  const service = createAuthService(authClient ?? createNeonAuthClient(env));
  app.decorateRequest('session', null);
  app.decorate('requireAuth', createRequireAuth(service.getSession));
  await app.register(authRoutes, { prefix: '/api/v1/auth', authService: service });
};

/** Registers the authentication service, request guard, and routes. */
export const authenticationPlugin = fp(plugin, { name: 'authentication', dependencies: ['rate-limit', 'database'] });
