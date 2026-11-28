import { useQuery } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { API_ENDPOINTS } from "@/config/api-endpoints"
import { apiClient, parseApiError } from "@/lib/api-client"

/** Loads the current session without treating a service outage as a signed-out state. */
export function useAuthSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    retry: false,
    queryFn: async () => {
      try {
        await apiClient.get(API_ENDPOINTS.auth.me)
        return true
      } catch (error) {
        if (error instanceof HTTPError && error.response.status === 401) return false
        throw await parseApiError(error)
      }
    },
  })
}
