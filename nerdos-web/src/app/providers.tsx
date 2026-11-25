import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface ProvidersProps {
  children: ReactNode
}

const COMPACT_BREAKPOINT = 768

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  })
}

export function Providers({ children }: ProvidersProps): ReactNode {
  const [queryClient] = useState(createQueryClient)
  const isCompact = useIsMobile()
  // Compact screens start with the icon rail; larger screens start expanded.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= COMPACT_BREAKPOINT)

  // Re-sync when the viewport crosses the breakpoint so the layout never gets stuck
  // in an expanded overlay after shrinking, or a collapsed rail after growing.
  const [previousCompact, setPreviousCompact] = useState(isCompact)
  if (previousCompact !== isCompact) {
    setPreviousCompact(isCompact)
    setSidebarOpen(!isCompact)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          {/* TODO: Wrap with <AuthProvider> here when auth is ready */}
          {children}
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
