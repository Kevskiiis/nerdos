import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { buildMetadata } from '../config/version.js';

interface TraceIdOptions {
  appVersion?: string;
}

const plugin: FastifyPluginAsync<TraceIdOptions> = async (app, options) => {
  app.decorateRequest('traceId', '');
  app.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-trace-id'];
    request.traceId = typeof incoming === 'string' && incoming.trim() ? incoming : randomUUID();
    request.log = request.log.child({ trace_id: request.traceId });
    reply.header('x-trace-id', request.traceId);
    reply.header('x-app-version', options.appVersion ?? buildMetadata.APP_VERSION);
  });
};

/** Propagates a request trace ID to request logs and response headers. */
export const traceIdPlugin = fp(plugin, { name: 'trace-id' });
