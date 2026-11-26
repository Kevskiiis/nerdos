import { z } from 'zod';
import { ErrorCode } from './error-codes.js';

/** Schema for the JSON error contract returned by all shared HTTP error handlers. */
export const errorResponseSchema = z.object({
  status: z.number().int().min(400).max(599),
  code: z.enum(ErrorCode),
  detail: z.string(),
  instance: z.string(),
  trace_id: z.string(),
  timestamp: z.iso.datetime(),
  retryable: z.boolean(),
  meta_data: z.record(z.string(), z.unknown()).optional(),
});
