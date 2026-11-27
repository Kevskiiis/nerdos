import { z } from 'zod';
import { buildMetadata } from './version.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CLIENT_ORIGIN: z.url().refine((value) => {
    const url = URL.parse(value);
    return url !== null && ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'must be an HTTP(S) origin without a path or trailing slash'),
  REDIS_URL: z.string().trim().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'rediss:' && Boolean(url.username) && Boolean(url.password);
    } catch {
      return false;
    }
  }, 'must be a TLS Redis URL with username and password'),
  REDIS_CA_CERT: z.string().transform((value) => value.replace(/\\n/g, '\n')).optional(),
  DATABASE_URL: z.url().refine((value) => ['postgres:', 'postgresql:'].includes(URL.parse(value)?.protocol ?? ''),
    'must be a PostgreSQL URL'),
});

/** Validates runtime configuration and combines it with immutable build metadata. */
export function loadEnv(rawEnv: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }
  return { ...result.data, ...buildMetadata };
}

export type Env = ReturnType<typeof loadEnv>;
