import { ApiError } from "@/lib/api-client"

/** Returns the first safe field-level validation detail supplied by the API, when present. */
export function getValidationDetail(error: ApiError): string | undefined {
  const fieldErrors = error.details?.field_errors
  if (!Array.isArray(fieldErrors)) return undefined
  const firstError = fieldErrors.find((entry) =>
    typeof entry === "object" && entry !== null && "message" in entry && typeof entry.message === "string",
  )
  return firstError && typeof firstError === "object" && "message" in firstError
    ? String(firstError.message)
    : undefined
}

/** Selects a clear signup error message without showing internal server details. */
export function getSignupErrorMessage(error: ApiError): string {
  switch (error.code) {
    case "EMAIL_ALREADY_EXISTS":
      return "An account with this email already exists. Log in or use a different email."
    case "VALIDATION_ERROR":
      return getValidationDetail(error) ?? "Check your name, email, and password, then try again."
    case "RATE_LIMITED":
      return "There have been too many signup attempts. Please wait a few minutes and try again."
    case "SERVICE_UNAVAILABLE":
      return "Signup is temporarily unavailable. Please try again shortly."
    case "NETWORK_ERROR":
      return "We couldn't connect. Check your internet connection and try again."
    default:
      return error.status >= 500
        ? "We couldn't create your account right now. Please try again shortly."
        : error.message
  }
}

/** Selects a clear login error message without showing internal server details. */
export function getLoginErrorMessage(error: ApiError): string {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "The email or password is incorrect. Check both and try again."
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email address before logging in."
    case "RATE_LIMITED":
      return "There have been too many login attempts. Please wait a few minutes and try again."
    case "SERVICE_UNAVAILABLE":
      return "Login is temporarily unavailable. Please try again shortly."
    case "NETWORK_ERROR":
      return "We couldn't connect. Check your internet connection and try again."
    default:
      return error.status >= 500
        ? "We couldn't log you in right now. Please try again shortly."
        : error.message
  }
}
