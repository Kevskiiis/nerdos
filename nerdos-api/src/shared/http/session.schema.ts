import { z } from 'zod';

/** Validates the minimal session information shared between modules. */
export const requestSessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.string().datetime(),
});

/** The minimal authenticated session attached to a request. */
export type RequestSession = z.infer<typeof requestSessionSchema>;
