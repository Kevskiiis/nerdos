import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolHeaderProps {
  /** Where the back button goes, e.g. the parent folder or the Library root. */
  backTo: string
  backLabel: string
  /** Name of the current item; omit when the page already shows it as its heading. */
  title?: string
  /** Right-aligned controls (save status, menus). */
  actions?: ReactNode
}

/** Sticky sub-header pinned just below the app top bar, shared by the folder, note and card set views. */
export function ToolHeader({ backTo, backLabel, title, actions }: ToolHeaderProps): ReactNode {
  return (
    <div className="sticky top-14 z-[9] flex h-12 items-center justify-between gap-2 border-b border-border bg-background/95 px-2 backdrop-blur sm:px-4 md:top-12">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={backTo}
          aria-label={`Back to ${backLabel}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-11 min-w-0 shrink px-2.5 md:min-h-8")}
        >
          <ArrowLeft />
          <span className="max-w-28 truncate sm:max-w-40">{backLabel}</span>
        </Link>
        {title && <span className="min-w-0 truncate text-sm text-muted-foreground">{title}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}
