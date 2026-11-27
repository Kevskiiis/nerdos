import { describe, expect, it } from 'vitest';
import { authUserSchema, emailSchema, passwordSchema, usernameSchema, otpCodeSchema, registerBodySchema, resetPasswordBodySchema, changePasswordBodySchema, authUserResponseSchema, messageResponseSchema } from '../../../src/modules/authentication/auth.schemas.js';

describe('authentication schemas', () => {
  it('enforces password boundaries', () => {
    expect(passwordSchema.safeParse('x'.repeat(11)).success).toBe(false);
    expect(passwordSchema.safeParse('x'.repeat(12)).success).toBe(true);
    expect(passwordSchema.safeParse('x'.repeat(128)).success).toBe(true);
    expect(passwordSchema.safeParse('x'.repeat(129)).success).toBe(false);
  });
  it('normalizes email, username and one-time codes', () => {
    expect(emailSchema.parse('  USER@Example.COM  ')).toBe('user@example.com');
    expect(usernameSchema.parse('  user  ')).toBe('user');
    expect(otpCodeSchema.parse('  1234  ')).toBe('1234');
    expect(emailSchema.safeParse('invalid').success).toBe(false);
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    expect(usernameSchema.safeParse('x'.repeat(33)).success).toBe(false);
    expect(otpCodeSchema.safeParse('123').success).toBe(false);
  });
  it('validates the private user profile and its response wrapper', () => {
    const user = { id: '1', email: 'user@example.com', emailVerified: false, name: null };
    expect(authUserResponseSchema.parse({ user })).toEqual({ user });
    expect(authUserSchema.safeParse({ ...user, id: '' }).success).toBe(false);
    expect(authUserSchema.safeParse({ ...user, email: 'invalid' }).success).toBe(false);
    expect(authUserSchema.safeParse({ ...user, emailVerified: undefined }).success).toBe(false);
  });
  it('applies field rules in request and response schemas', () => {
    expect(registerBodySchema.parse({ username: ' user ', email: ' U@EXAMPLE.COM ', password: 'x'.repeat(12) })).toMatchObject({ username: 'user', email: 'u@example.com' });
    expect(resetPasswordBodySchema.safeParse({ email: 'u@example.com', code: '1234', newPassword: 'short' }).success).toBe(false);
    expect(changePasswordBodySchema.safeParse({ currentPassword: 'x'.repeat(12), newPassword: 'y'.repeat(12) }).success).toBe(true);
    expect(messageResponseSchema.safeParse({ message: 'Done' }).success).toBe(true);
  });
});
