import { API_ENDPOINTS } from "@/config/api-endpoints"
import { apiClient, parseApiError } from "@/lib/api-client"
import {
  authUserResponseSchema,
  registerResponseSchema,
  type AuthUser,
  type LoginFormValues,
  type SignupFormValues,
} from "@/features/auth/lib/auth.schemas"

/** Registers a user and returns the API's verification prompt. */
export async function registerUser(values: SignupFormValues): Promise<{ message: string }> {
  try {
    const { firstName, lastName, ...credentials } = values
    const body = await apiClient.post(API_ENDPOINTS.auth.register, { json: { ...credentials, name: `${firstName} ${lastName}` } }).json<unknown>()
    return registerResponseSchema.parse(body)
  } catch (error) {
    throw await parseApiError(error)
  }
}

/** Signs in a user and returns the authenticated profile. */
export async function loginUser(values: LoginFormValues): Promise<AuthUser> {
  try {
    const body = await apiClient.post(API_ENDPOINTS.auth.login, { json: values }).json<unknown>()
    return authUserResponseSchema.parse(body).user
  } catch (error) {
    throw await parseApiError(error)
  }
}

/** Loads the authenticated user's profile from the session cookie. */
export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const body = await apiClient.get(API_ENDPOINTS.auth.me).json<unknown>()
    return authUserResponseSchema.parse(body).user
  } catch (error) {
    throw await parseApiError(error)
  }
}
