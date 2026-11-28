import type { ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { SessionLoading } from "@/components/auth/SessionLoading"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { useAuthSession } from "@/app/auth-session"
import { Outlet, Link } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"

import { LandingPage } from "@/features/landing/pages/LandingPage"

// Page imports
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { DailyReviewPage } from "@/features/dashboard/pages/DailyReviewPage"
import { CardSetPage } from "@/features/library/pages/CardSetPage"
import { FolderPage } from "@/features/library/pages/FolderPage"
import { LibraryPage } from "@/features/library/pages/LibraryPage"
import { NotePage } from "@/features/library/pages/NotePage"
import { SettingsPage } from "@/features/settings/pages/SettingsPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { SignupPage } from "@/features/auth/pages/SignupPage"

function GuestOnlyRoute() {
  const session = useAuthSession()
  if (session.isPending) return <SessionLoading />
  return session.data ? <Navigate to="/dashboard" replace /> : <Outlet />
}

function AuthPlaceholder() {
  return <main className="mx-auto max-w-xl p-6"><Link to="/" className="inline-flex min-h-11 items-center underline">Back to Nerdos</Link><h1 className="text-2xl font-bold">Authentication is coming soon</h1></main>
}

/** Defines public, guest-only, and authenticated application routes. */
export function Router(): ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
        </Route>
        <Route element={<GuestOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<SignupPage />} />
          {["verify-email", "forgot-password", "reset-password"].map((path) => <Route key={path} path={path} element={<AuthPlaceholder />} />)}
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/review" element={<DailyReviewPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="library/notes/:noteId" element={<NotePage />} />
            <Route path="library/cards/:setId" element={<CardSetPage />} />
            <Route path="library/:folderId" element={<FolderPage />} />
            {/* Legacy URLs from before Notes and Notecards were merged into Library. */}
            <Route path="notes/*" element={<Navigate to="/library" replace />} />
            <Route path="notecards/*" element={<Navigate to="/library" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
