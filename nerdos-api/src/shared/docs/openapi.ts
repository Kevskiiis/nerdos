import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { Env } from '../config/env.js';

interface OpenApiOptions {
  env: Pick<Env, 'NODE_ENV' | 'APP_NAME' | 'APP_VERSION'>;
}

const plugin: FastifyPluginAsync<OpenApiOptions> = async (app, { env }) => {
  if (env.NODE_ENV === 'production') return;

  await app.register(swagger, {
    openapi: { info: { title: env.APP_NAME, version: env.APP_VERSION } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUI, { routePrefix: '/docs' });
};

/** Serves Zod-derived OpenAPI documentation outside production. */
export const openapiPlugin = fp(plugin, { name: 'openapi' });
