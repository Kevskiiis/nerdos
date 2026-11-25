import type { ReactNode } from "react"
import type { MasteryBreakdown } from "../../lib/card-status"
import { cn } from "@/lib/utils"

const SEGMENTS: readonly { key: keyof MasteryBreakdown; label: string; className: string }[] = [
  { key: "new", label: "New", className: "bg-muted-foreground/40" },
  { key: "learning", label: "Learning", className: "bg-primary/50" },
  { key: "mastered", label: "Mastered", className: "bg-primary" },
]

/** Stacked bar plus legend; the three counts always add up to the card total. */
export function MasteryBar({ breakdown }: { breakdown: MasteryBreakdown }): ReactNode {
  const total = breakdown.new + breakdown.learning + breakdown.mastered
  const summary = SEGMENTS.map(({ key, label }) => `${breakdown[key]} ${label.toLowerCase()}`).join(", ")

  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label={`Mastery: ${summary}`} className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          SEGMENTS.map(({ key, className }) =>
            breakdown[key] > 0 ? (
              <div key={key} className={cn("h-full transition-all", className)} style={{ width: `${(breakdown[key] / total) * 100}%` }} />
            ) : null
          )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {SEGMENTS.map(({ key, label, className }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", className)} aria-hidden="true" />
            <span className="tabular-nums">{breakdown[key]}</span> {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
