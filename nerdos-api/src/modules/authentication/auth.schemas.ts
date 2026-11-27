import { z } from 'zod';

/** Validates the authentication module's private user profile. */
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  emailVerified: z.boolean(),
});
/** A user profile used only within the authentication module. */
export type AuthUser = z.infer<typeof authUserSchema>;

/** Normalizes and validates an email address. */
export const emailSchema = z.string({ error: 'Enter an email address.' })
  .trim()
  .toLowerCase()
  .min(1, 'Enter an email address.')
  .max(254, 'Email address must be at most 254 characters.')
  .email('Enter a valid email address.');

/** Validates passwords created or changed under the current policy. */
export const newPasswordSchema = z.string({ error: 'Enter a password.' })
  .min(12, 'Password must be at least 12 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/^[\x20-\x7E]+$/, 'Password may only contain letters, numbers, spaces, and standard special characters.')
  .refine((value) => value.trim().length > 0, 'Password cannot be blank.');

/** Validates an existing password without enforcing new-password length rules. */
export const existingPasswordSchema = z.string({ error: 'Enter your password.' })
  .min(1, 'Enter your password.')
  .max(128, 'Password must be at most 128 characters.');

/** Normalizes and validates a username. */
export const usernameSchema = z.string({ error: 'Enter a username.' })
  .trim()
  .min(1, 'Enter a username.')
  .refine((value) => value.length === 0 || value.length >= 3, 'Username must be at least 3 characters.')
  .max(32, 'Username must be at most 32 characters.')
  .regex(/^[a-zA-Z0-9._-]*$/, 'Username may only contain letters, numbers, underscores, hyphens, and dots.');

/** Normalizes and validates a 6-digit one-time verification code. */
export const otpCodeSchema = z.string({ error: 'Enter the verification code.' })
  .trim()
  .min(1, 'Enter the verification code.')
  .regex(/^\d+$/, 'Verification code must contain only numbers.')
  .length(6, 'Verification code must be 6 digits.');

/** Validates registration input. */
export const registerBodySchema = z.object({
  name: z.string({ error: 'Enter your name.' }).trim().min(1, 'Enter your name.').max(128, 'Name must be at most 128 characters.'),
  email: emailSchema,
  password: newPasswordSchema,
});
/** Validates a generic success message. */
export const messageResponseSchema = z.object({ message: z.string() });
/** Validates a registration response. */
export const registerResponseSchema = messageResponseSchema;
/** Validates email verification input. */
export const verifyEmailBodySchema = z.object({ email: emailSchema, code: otpCodeSchema });
/** Validates a response containing an authentication user profile. */
export const authUserResponseSchema = z.object({ user: authUserSchema });
/** Validates verification resend input. */
export const resendVerificationBodySchema = z.object({ email: emailSchema });
/** Validates login input. */
export const loginBodySchema = z.object({ email: emailSchema, password: existingPasswordSchema });
/** Validates a logout response. */
export const logoutResponseSchema = messageResponseSchema;
/** Validates a logout-all response. */
export const logoutAllResponseSchema = messageResponseSchema;
/** Validates the current-user response. */
export const meResponseSchema = authUserResponseSchema;
/** Validates a forgot-password request. */
export const forgotPasswordBodySchema = z.object({ email: emailSchema });
/** Validates a password-reset request. */
export const resetPasswordBodySchema = z.object({ email: emailSchema, code: otpCodeSchema, newPassword: newPasswordSchema });
/** Validates a password-change request. */
export const changePasswordBodySchema = z.object({ currentPassword: existingPasswordSchema, newPassword: newPasswordSchema })
  .refine((data) => data.newPassword !== data.currentPassword, { message: 'New password must be different from current password.', path: ['newPassword'] });
