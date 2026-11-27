import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { createRateLimitPolicy } from '../../../src/shared/http/rate-limit.js';

describe('rate limit policies', () => {
  const request = { ip: '127.0.0.1', session: { userId: 'user-1' } } as unknown as FastifyRequest;
  it.each([
    [undefined, 'tier:127.0.0.1'], ['ip', 'tier:127.0.0.1'], ['user', 'tier:user-1'],
  ] as const)('keys by %s', async (keyBy, expected) => {
    const policy = createRateLimitPolicy({ tier: 'tier', max: 1, timeWindow: 1000, keyBy });
    expect(await policy.keyGenerator!(request)).toBe(expected);
  });
  it('falls back to IP for a missing session and supports custom keys', async () => {
    const policy = createRateLimitPolicy({ tier: 'tier', max: 1, timeWindow: 1000, keyBy: 'user' });
    expect(await policy.keyGenerator!({ ip: 'ip', session: null } as unknown as FastifyRequest)).toBe('tier:ip');
    expect(await createRateLimitPolicy({ tier: 'tier', max: 1, timeWindow: 1000, keyBy: () => 'custom' }).keyGenerator!(request)).toBe('tier:custom');
  });
});
