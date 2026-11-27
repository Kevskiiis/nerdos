import { describe, expect, it } from 'vitest';
import { otpCodeSchema } from '../../../src/modules/authentication/auth.schemas.js';

function messages(value: unknown): string[] {
  const result = otpCodeSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('otpCodeSchema', () => {
  it.each([['123456', '123456'], ['004219', '004219'], ['  123456  ', '123456']])('accepts and normalizes %s', (value, expected) => {
    expect(otpCodeSchema.parse(value)).toBe(expected);
  });
  it.each([undefined, null, 123456, {}, '', '   '])('requires a code for %s', (value) => {
    expect(messages(value)).toContain('Enter the verification code.');
  });
  it.each(['12345a', 'abcdef', '123 456', '123-456', '12345!', '１２３４５６'])('rejects nonnumeric code %s', (value) => {
    expect(messages(value)).toContain('Verification code must contain only numbers.');
  });
  it.each(['12345', '  12345  ', '1234567'])('rejects incorrect code length for %s', (value) => {
    expect(messages(value)).toContain('Verification code must be 6 digits.');
  });
});
