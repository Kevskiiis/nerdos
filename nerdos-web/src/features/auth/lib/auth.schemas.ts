import { z } from "zod"

/** Validates and normalizes email addresses using the API's public signup rules. */
export const emailSchema = z.string({ error: "Enter an email address." })
  .trim()
  .toLowerCase()
  .min(1, "Enter an email address.")
  .max(254, "Email address must be at most 254 characters.")
  .email("Enter a valid email address.")

/** Validates the full name required by Neon Auth registration. */
export const nameSchema = z.string({ error: "Enter your first and last name." })
  .trim()
  .min(1, "Enter your first and last name.")
  .max(128, "Name must be at most 128 characters.")

/** Validates a new password against the API's signup policy. */
export const newPasswordSchema = z.string({ error: "Enter a password." })
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/^[\x20-\x7E]+$/, "Password may only contain standard printable characters.")
  .refine((value) => value.trim().length > 0, "Password cannot be blank.")

/** Validates an existing password without requiring it to meet new-password rules. */
export const existingPasswordSchema = z.string()
  .min(1, "Password is required.")
  .max(128, "Password must be at most 128 characters.")

/** Validates and normalizes the registration form. */
export const signupFormSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: emailSchema,
  password: newPasswordSchema,
}).refine((value) => `${value.firstName} ${value.lastName}`.length <= 128, {
  path: ["lastName"], message: "Your full name must be at most 128 characters.",
})

/** Validates and normalizes the login form. */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: existingPasswordSchema,
})

/** Describes the current user profile returned by the authentication API. */
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  emailVerified: z.boolean(),
})

/** Validates the user envelope returned by login and session endpoints. */
export const authUserResponseSchema = z.object({ user: authUserSchema })

/** Validates the registration success message returned by the API. */
export const registerResponseSchema = z.object({ message: z.string() })

/** The normalized values submitted by the signup form. */
export type SignupFormValues = z.infer<typeof signupFormSchema>
/** The normalized values submitted by the login form. */
export type LoginFormValues = z.infer<typeof loginFormSchema>
/** The public user shape returned by authentication endpoints. */
export type AuthUser = z.infer<typeof authUserSchema>
