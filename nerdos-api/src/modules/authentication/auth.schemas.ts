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
export const emailSchema = z.string().trim().toLowerCase().email();
/** Validates a password's length. */
export const passwordSchema = z.string().min(12).max(128);
/** Normalizes and validates a username. */
export const usernameSchema = z.string().trim().min(3).max(32);
/** Normalizes and validates a one-time code. */
export const otpCodeSchema = z.string().trim().min(4).max(12);

/** Validates registration input. */
export const registerBodySchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema });
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
export const loginBodySchema = z.object({ email: emailSchema, password: passwordSchema });
/** Validates a logout response. */
export const logoutResponseSchema = messageResponseSchema;
/** Validates a logout-all response. */
export const logoutAllResponseSchema = messageResponseSchema;
/** Validates the current-user response. */
export const meResponseSchema = authUserResponseSchema;
/** Validates a forgot-password request. */
export const forgotPasswordBodySchema = z.object({ email: emailSchema });
/** Validates a password-reset request. */
export const resetPasswordBodySchema = z.object({ email: emailSchema, code: otpCodeSchema, newPassword: passwordSchema });
/** Validates a password-change request. */
export const changePasswordBodySchema = z.object({ currentPassword: passwordSchema, newPassword: passwordSchema });
