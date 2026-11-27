import { describe, expect, it } from 'vitest';
import { usernameSchema } from '../../../src/modules/authentication/auth.schemas.js';

function errors(value: unknown): string[] {
  const result = usernameSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('usernameSchema', () => {
  it('accepts allowed characters and trims without changing case', () => {
    expect(usernameSchema.parse('dev_user-01.test')).toBe('dev_user-01.test');
    expect(usernameSchema.parse('  Alex_99  ')).toBe('Alex_99');
  });
  it.each([undefined, null, 123, {}, '', '   '])('asks for a username when given %s', (value) => {
    expect(errors(value)).toEqual(['Enter a username.']);
  });
  it('validates trimmed length boundaries', () => {
    for (const value of ['ab', '  ab  ']) expect(errors(value)).toContain('Username must be at least 3 characters.');
    expect(usernameSchema.safeParse('abc').success).toBe(true);
    expect(usernameSchema.safeParse('x'.repeat(32)).success).toBe(true);
    expect(errors('x'.repeat(33))).toContain('Username must be at most 32 characters.');
  });
  it.each(['john doe', 'user@name', 'user!name', 'user/name', 'user+1', 'josé', 'user🚀', 'ｕｓｅｒ', 'user\u200bname', 'user\nname', 'user\tname'])('rejects unsupported characters in %s', (value) => {
    expect(errors(value)).toContain('Username may only contain letters, numbers, underscores, hyphens, and dots.');
  });
});
