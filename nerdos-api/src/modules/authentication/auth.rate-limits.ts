import { createRateLimitPolicy } from '../../shared/http/rate-limit.js';

/** Named authentication policies shared by routes in the same tier. */
export const AUTH_RATE_LIMITS = {
  bruteForce: createRateLimitPolicy({ tier: 'auth-brute', max: 10, timeWindow: '1 minute', keyBy: 'ip' }),
  emailTrigger: createRateLimitPolicy({ tier: 'email-trigger', max: 10, timeWindow: '10 minutes', keyBy: 'ip' }),
  sensitiveUserAction: createRateLimitPolicy({ tier: 'auth-user-sensitive', max: 10, timeWindow: '10 minutes', keyBy: 'user' }),
};
