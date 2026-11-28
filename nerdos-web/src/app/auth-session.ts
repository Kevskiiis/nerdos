import { useQuery } from "@tanstack/react-query"

/** Loads the current session without treating a service outage as a signed-out state. */
export function useAuthSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    retry: false,
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/auth/me`, { credentials: "include" })
      if (response.status === 401) return false
      if (!response.ok) throw new Error("Unable to check your session.")
      return true
    },
  })
}
