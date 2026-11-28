import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthSession } from "@/app/auth-session"
import { SessionLoading } from "@/components/auth/SessionLoading"

/** Allows authenticated visitors through and redirects signed-out visitors to login. */
export function ProtectedRoute(): ReactNode {
  const session = useAuthSession()
  const location = useLocation()
  if (session.isPending) return <SessionLoading />
  if (session.isError) return <p className="p-6" role="alert">Unable to check your session. Please try again later.</p>
  return session.data ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
