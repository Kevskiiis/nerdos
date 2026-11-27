import type { FastifyRequest } from 'fastify';
import { expect, it } from 'vitest';
import { AUTH_RATE_LIMITS } from '../../../src/modules/authentication/auth.rate-limits.js';

it('configures shared authentication tiers with the correct identifiers and windows', async () => {
  const request = { ip: '127.0.0.1', session: { userId: 'user-1' } } as FastifyRequest;
  expect(AUTH_RATE_LIMITS.bruteForce).toMatchObject({ max: 10, timeWindow: '1 minute' });
  expect(AUTH_RATE_LIMITS.emailTrigger).toMatchObject({ max: 10, timeWindow: '10 minutes' });
  expect(AUTH_RATE_LIMITS.sensitiveUserAction).toMatchObject({ max: 10, timeWindow: '10 minutes' });
  expect(await AUTH_RATE_LIMITS.bruteForce.keyGenerator!(request)).toBe('auth-brute:127.0.0.1');
  expect(await AUTH_RATE_LIMITS.emailTrigger.keyGenerator!(request)).toBe('email-trigger:127.0.0.1');
  expect(await AUTH_RATE_LIMITS.sensitiveUserAction.keyGenerator!(request)).toBe('auth-user-sensitive:user-1');
});
