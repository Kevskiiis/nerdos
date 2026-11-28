import ky, { HTTPError, TimeoutError } from "ky"
import { env } from "@/config/env"

/** A normalized, safe-to-display API failure. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryable: boolean
  readonly details?: Record<string, unknown>

  constructor(options: {
    status: number
    code: string
    message: string
    retryable?: boolean
    details?: Record<string, unknown>
  }) {
    super(options.message)
    this.name = "ApiError"
    this.status = options.status
    this.code = options.code
    this.retryable = options.retryable ?? false
    this.details = options.details
  }
}

/** Shared HTTP client for backend requests, including cross-site session cookies. */
export const apiClient = ky.create({
  prefix: env.VITE_API_BASE_URL,
  credentials: "include",
  timeout: 10_000,
  retry: 0,
  headers: { Accept: "application/json" },
})

interface ApiErrorPayload {
  code?: unknown
  detail?: unknown
  message?: unknown
  retryable?: unknown
  meta_data?: unknown
  details?: unknown
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function safeNetworkMessage(error: unknown): { code: string; message: string } {
  if (error instanceof TimeoutError) {
    return { code: "REQUEST_TIMEOUT", message: "The request took too long. Please try again." }
  }

  if (error instanceof TypeError || (error instanceof Error && error.name === "NetworkError")) {
    return { code: "NETWORK_ERROR", message: "Unable to connect. Check your internet connection and try again." }
  }

  return { code: "REQUEST_FAILED", message: "Something went wrong. Please try again." }
}

/** Converts ky HTTP, timeout, and network failures into a predictable safe error shape. */
export async function parseApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) return error

  if (error instanceof HTTPError) {
    const payload = asRecord(error.data) as ApiErrorPayload | undefined
    const fallback = safeNetworkMessage(error)
    const message = typeof payload?.detail === "string"
      ? payload.detail
      : typeof payload?.message === "string"
        ? payload.message
        : error.response.status >= 500
          ? "The service is temporarily unavailable. Please try again later."
          : fallback.message
    const details = asRecord(payload?.meta_data) ?? asRecord(payload?.details)

    return new ApiError({
      status: error.response.status,
      code: typeof payload?.code === "string" ? payload.code : "HTTP_ERROR",
      message,
      retryable: typeof payload?.retryable === "boolean" ? payload.retryable : error.response.status >= 500,
      details,
    })
  }

  const fallback = safeNetworkMessage(error)
  return new ApiError({
    status: 0,
    code: fallback.code,
    message: fallback.message,
    retryable: true,
  })
}
