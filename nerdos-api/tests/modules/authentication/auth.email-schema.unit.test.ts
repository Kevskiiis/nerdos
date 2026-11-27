import { describe, expect, it } from 'vitest';
import { emailSchema } from '../../../src/modules/authentication/auth.schemas.js';

const validEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;

describe('emailSchema', () => {
  it('trims and lowercases an email address', () => {
    expect(emailSchema.parse('  User@Example.COM  ')).toBe('user@example.com');
  });
  it.each([undefined, null, 123, '', '   '])('explains that an email is required for %s', (value) => {
    const result = emailSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain('Enter an email address.');
  });
  it('accepts 254 characters and provides a length message for 255', () => {
    expect(validEmail).toHaveLength(254);
    expect(emailSchema.safeParse(validEmail).success).toBe(true);
    const result = emailSchema.safeParse(`a${validEmail}`);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain('Email address must be at most 254 characters.');
  });
  it.each(['not-an-email', 'user@', '@example.com', 'user@example'])('explains the required format for %s', (value) => {
    const result = emailSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain('Enter a valid email address.');
  });
});
