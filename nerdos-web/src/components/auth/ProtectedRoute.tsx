import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthSession } from "@/app/auth-session"

/** Allows authenticated visitors through and redirects signed-out visitors to login. */
export function ProtectedRoute(): ReactNode {
  const session = useAuthSession()
  const location = useLocation()
  if (session.isPending) return <p className="p-6">Checking your session…</p>
  if (session.isError) return <p className="p-6" role="alert">Unable to check your session. Please try again later.</p>
  return session.data ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
