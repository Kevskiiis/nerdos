import { z } from "zod"

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .url("VITE_API_BASE_URL must be a valid absolute URL, such as http://localhost:3000.")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "VITE_API_BASE_URL must use HTTP or HTTPS.",
    })
    .transform((value) => value.replace(/\/+$/, "")),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
  throw new Error(`Invalid frontend environment configuration:\n${issues}`)
}

/** Validated frontend environment variables, normalized for use by the API client. */
export const env = parsedEnv.data
