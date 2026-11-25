/**
 * Typed navigation configuration for workspace routes and utilities.
 * Add new routes here and they will automatically scale through the app.
 */

import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, Library, Settings, HelpCircle } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  group: "workspace" | "utilities"
}

export const navigationConfig: NavItem[] = [
  // Workspace routes
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "workspace",
  },
  {
    label: "Library",
    href: "/library",
    icon: Library,
    group: "workspace",
  },

  // Utility routes (footer)
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    group: "utilities",
  },
  {
    label: "Support",
    href: "#support",
    icon: HelpCircle,
    group: "utilities",
  },
]

export const workspaceRoutes = navigationConfig.filter((item) => item.group === "workspace")
export const utilityRoutes = navigationConfig.filter((item) => item.group === "utilities")

/** A nav item is active on its own path and on any nested path beneath it. */
export function isRouteActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
