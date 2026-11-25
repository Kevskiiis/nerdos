import type { ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppTopbar } from "./AppTopbar"

/**
 * Persistent application shell. Must render inside <SidebarProvider>, which
 * supplies the full-width flex row that the sidebar and inset share.
 * - Mobile: sidebar is a slide-over drawer opened from the top bar trigger.
 * - Desktop (md+): full-height sidebar that collapses to an icon rail via its own header toggle.
 */
export function AppShell(): ReactNode {
  const location = useLocation()

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon">
        <AppSidebar />
      </Sidebar>

      <SidebarInset className="min-h-dvh min-w-0">
        <AppTopbar currentPath={location.pathname} />

        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </>
  )
}
