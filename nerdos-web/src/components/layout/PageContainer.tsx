import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/** Standard padded canvas for route pages. Full-bleed pages (e.g. the document view) skip it. */
export function PageContainer({ children, className }: PageContainerProps): ReactNode {
  return <div className={cn("flex flex-1 flex-col p-4 pb-safe md:p-6", className)}>{children}</div>
}
