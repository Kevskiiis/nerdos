import type { ReactNode } from "react"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "../hooks/use-autosave-page"

interface SaveStatusIndicatorProps {
  status: SaveStatus
  onRetry: () => void
}

/** Icon always visible; text label from `sm` up (announced to screen readers at every size). */
export function SaveStatusIndicator({ status, onRetry }: SaveStatusIndicatorProps): ReactNode {
  if (status === "error") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 gap-1.5 text-destructive md:min-h-8"
        onClick={onRetry}
      >
        <AlertCircle />
        <span className="sr-only sm:not-sr-only">Save failed. Retry</span>
      </Button>
    )
  }

  const isSaving = status === "saving"
  return (
    <span
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-1.5 px-1 text-xs text-muted-foreground"
    >
      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      <span className="sr-only sm:not-sr-only">{isSaving ? "Saving..." : "Saved"}</span>
    </span>
  )
}
