import 'fastify';
import type { Sql } from 'postgres';

declare module 'fastify' {
  interface FastifyInstance {
    sql: Sql;
  }

  interface FastifyRequest {
    traceId: string;
  }
}
