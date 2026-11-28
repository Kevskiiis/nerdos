import { LoaderCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/** Shows a centered, accessible loading state while the session is checked. */
export function SessionLoading() {
  return (
    <main className="flex min-h-dvh w-full min-w-0 flex-1 items-center justify-center bg-background px-4 text-foreground">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2 font-semibold">Nerdos <Badge variant="secondary">Beta</Badge></div>
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-foreground">
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin motion-reduce:animate-none" />
        </div>
        <p className="text-sm text-muted-foreground">Getting things ready…</p>
      </div>
    </main>
  )
}
