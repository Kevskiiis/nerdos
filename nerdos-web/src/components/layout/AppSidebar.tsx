import type { ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { workspaceRoutes, utilityRoutes, isRouteActive } from "@/config/navigation"
import { SupportDialog } from "./SupportDialog"

const NAV_BUTTON_CLASS = "min-h-11 cursor-pointer md:min-h-8"

/**
 * Three-zone sidebar:
 * 1. Header: brand + collapse/expand toggle. When collapsed, only the toggle is shown.
 * 2. Content: workspace navigation
 * 3. Footer: utilities (Settings, Support)
 *
 * The layout is identical at every screen size. On compact screens the expanded
 * sidebar overlays the page, so it collapses again after a destination is picked.
 */
export function AppSidebar(): ReactNode {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isMobile, state, toggleSidebar, setOpen } = useSidebar()

  const collapseIfCompact = () => {
    if (isMobile) setOpen(false)
  }

  const handleNavigate = (href: string) => {
    navigate(href)
    collapseIfCompact()
  }

  const isCollapsed = state === "collapsed"
  const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = isCollapsed ? "Expand sidebar" : "Collapse sidebar"

  const SettingsIcon = utilityRoutes[0]?.icon
  const SupportIcon = utilityRoutes[1]?.icon

  return (
    <>
      <SidebarHeader>
        <div className="flex min-h-11 items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center md:min-h-8">
          <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              N
            </div>
            <span className="truncate font-semibold tracking-tight">Nerdos</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            className="size-11 shrink-0 text-muted-foreground hover:text-foreground md:size-8"
          >
            <ToggleIcon className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {workspaceRoutes.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => handleNavigate(item.href)}
                  isActive={isRouteActive(item.href, pathname)}
                  aria-current={isRouteActive(item.href, pathname) ? "page" : undefined}
                  className={NAV_BUTTON_CLASS}
                  tooltip={{ children: item.label, side: "right" }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("/settings")}
              isActive={isRouteActive("/settings", pathname)}
              aria-current={isRouteActive("/settings", pathname) ? "page" : undefined}
              className={`${NAV_BUTTON_CLASS} text-muted-foreground hover:text-foreground`}
              tooltip={{ children: "Settings", side: "right" }}
            >
              {SettingsIcon && <SettingsIcon />}
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SupportDialog
              icon={SupportIcon}
              label="Support"
              onOpen={collapseIfCompact}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
