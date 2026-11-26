import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRedisKey, buildRedisNamespace } from '../../../src/shared/cache/redis-keys.js';

afterEach(() => vi.unstubAllEnvs());

describe('Redis key builders', () => {
  it.each([['development', 'dev'], ['test', 'test'], ['production', 'prod']] as const)(
    'formats %s keys', (environment, expected) => {
      expect(buildRedisNamespace('rl', environment)).toBe(`nerdos:${expected}:rl:`);
      expect(buildRedisKey('rl', 'global', '127.0.0.1', environment)).toBe(`nerdos:${expected}:rl:global:127.0.0.1`);
    },
  );

  it('defaults to NODE_ENV, or development when unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(buildRedisNamespace('rl')).toBe('nerdos:prod:rl:');
    vi.stubEnv('NODE_ENV', undefined);
    expect(buildRedisNamespace('rl')).toBe('nerdos:dev:rl:');
  });

  it('rejects unknown environments', () => {
    vi.stubEnv('NODE_ENV', 'staging');
    expect(() => buildRedisNamespace('rl')).toThrow();
  });
});
