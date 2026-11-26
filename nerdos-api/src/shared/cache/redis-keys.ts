import { z } from 'zod';

const nodeEnvironment = z.enum(['development', 'test', 'production']);
type NodeEnvironment = z.infer<typeof nodeEnvironment>;
const shortEnvironment: Record<NodeEnvironment, string> = { development: 'dev', test: 'test', production: 'prod' };

/** Builds a Redis namespace for a subsystem and environment, including the trailing colon. */
export function buildRedisNamespace(subsystem: string, nodeEnv: NodeEnvironment = nodeEnvironment.parse(process.env.NODE_ENV ?? 'development')): string {
  return `nerdos:${shortEnvironment[nodeEnvironment.parse(nodeEnv)]}:${subsystem}:`;
}

/** Builds a complete Redis key from the subsystem, tier, and identifier. */
export function buildRedisKey(subsystem: string, tier: string, identifier: string, nodeEnv?: NodeEnvironment): string {
  return `${buildRedisNamespace(subsystem, nodeEnv)}${tier}:${identifier}`;
}
