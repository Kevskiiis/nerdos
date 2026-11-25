import type { ReactNode } from "react"
import { AlertCircle, FileQuestion, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { libraryPaths } from "../routes"

interface LibraryEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
}

/** Compact dashed placeholder for empty sections and zero search results. */
export function LibraryEmptyState({ icon: Icon, title, description, children }: LibraryEmptyStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}

export function LibraryLoadingState(): ReactNode {
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6" aria-busy="true" aria-label="Loading library">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    </div>
  )
}

export function LibraryErrorState({ onRetry }: { onRetry: () => void }): ReactNode {
  return (
    <div className="p-4 md:p-6">
      <LibraryEmptyState
        icon={AlertCircle}
        title="Couldn't load your library"
        description="Something went wrong while loading. Check your connection and try again."
      >
        <Button variant="outline" className="mt-2 min-h-11 md:min-h-9" onClick={onRetry}>
          Try again
        </Button>
      </LibraryEmptyState>
    </div>
  )
}

const NOT_FOUND_TITLES = { folder: "Folder not found", page: "Page not found", cardSet: "Card set not found" } as const

export function LibraryNotFoundState({ kind }: { kind: keyof typeof NOT_FOUND_TITLES }): ReactNode {
  return (
    <div className="p-4 md:p-6">
      <LibraryEmptyState icon={FileQuestion} title={NOT_FOUND_TITLES[kind]} description="It may have been deleted or moved.">
        <Link to={libraryPaths.root} className={cn(buttonVariants({ variant: "outline" }), "mt-2 min-h-11 md:min-h-9")}>
          Back to Library
        </Link>
      </LibraryEmptyState>
    </div>
  )
}

export function LibraryActionError({ message, onDismiss }: { message: string; onDismiss: () => void }): ReactNode {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <span className="min-w-0">{message}</span>
      <Button variant="ghost" size="sm" className="shrink-0 text-destructive" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  )
}
