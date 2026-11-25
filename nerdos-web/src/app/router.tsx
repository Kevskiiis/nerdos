import type { ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"

// Page imports
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { DailyReviewPage } from "@/features/dashboard/pages/DailyReviewPage"
import { CardSetPage } from "@/features/library/pages/CardSetPage"
import { FolderPage } from "@/features/library/pages/FolderPage"
import { LibraryPage } from "@/features/library/pages/LibraryPage"
import { NotePage } from "@/features/library/pages/NotePage"
import { SettingsPage } from "@/features/settings/pages/SettingsPage"

export function Router(): ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - TODO: Add landing, login, signup here */}
        <Route index element={<Navigate to="/dashboard" replace />} />

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
