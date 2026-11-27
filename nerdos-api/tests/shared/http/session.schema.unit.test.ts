import { describe, expect, it } from 'vitest';
import { requestSessionSchema } from '../../../src/shared/http/session.schema.js';

const valid = { sessionId: 'session-1', userId: 'user-1', expiresAt: '2026-11-26T12:00:00.000Z' };

describe('requestSessionSchema', () => {
  it('accepts a valid session', () => {
    expect(requestSessionSchema.parse(valid)).toEqual(valid);
  });
  it.each([
    { ...valid, sessionId: undefined }, { ...valid, sessionId: '' },
    { ...valid, userId: undefined }, { ...valid, userId: '' },
    { ...valid, expiresAt: 'not-a-date' },
  ])('rejects an invalid session', (session) => {
    expect(requestSessionSchema.safeParse(session).success).toBe(false);
  });
});
