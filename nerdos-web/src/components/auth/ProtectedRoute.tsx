import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

/**
 * Pass-through route guard for protected routes.
 * Currently allows all access; will integrate session checks when <AuthProvider> is ready.
 *
 * TODO: Implement session validation:
 * - Check if user is authenticated
 * - Show loading state while checking
 * - Redirect to /login if unauthenticated
 * - Preserve intended destination for post-login redirect
 */
export function ProtectedRoute(): ReactNode {
  return <Outlet />
}
