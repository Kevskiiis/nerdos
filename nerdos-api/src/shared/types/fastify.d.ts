import 'fastify';
import type { Sql } from 'postgres';
import type { Redis } from 'ioredis';
import type { preHandlerHookHandler } from 'fastify';
import type { RequestSession } from '../http/session.schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    sql: Sql;
    redis: Redis;
    requireAuth: preHandlerHookHandler;
  }

  interface FastifyRequest {
    traceId: string;
    session: RequestSession | null;
  }
}
