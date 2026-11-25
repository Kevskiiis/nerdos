import type { ReactNode } from "react"

interface AppTopbarProps {
  currentPath: string
}

/**
 * Sticky top bar showing the active page title (h-14 on small screens, h-12 on md+).
 * The sidebar toggle lives inside the sidebar so the layout is the same at every size.
 */
export function AppTopbar({ currentPath }: AppTopbarProps): ReactNode {
  const getPageTitle = (): string => {
    const segments = currentPath.split("/").filter(Boolean)
    if (!segments.length) return "Dashboard"

    const route = segments[0]
    return route.charAt(0).toUpperCase() + route.slice(1)
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur md:h-12">
      <h1 className="text-sm font-semibold tracking-tight">{getPageTitle()}</h1>
    </header>
  )
}
