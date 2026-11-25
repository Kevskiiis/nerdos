import type { ReactNode } from "react"
import { CheckCircle2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatInterval } from "../../lib/scheduler"
import type { SessionState, SessionSummary as Summary, StudyKind } from "../../lib/study-session"
import { pluralize } from "../../lib/browse"
import type { ReviewRating } from "../../types"

const RATING_LABELS: readonly { rating: ReviewRating; label: string }[] = [
  { rating: "again", label: "Again" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" },
]

const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

interface SessionSummaryProps {
  kind: StudyKind
  state: SessionState
  summary: Summary
  /** False when the set has no cards, so there is nothing to cram. */
  canCram: boolean
  onCramAgain: () => void
  onBack: () => void
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/** End-of-session screen. Also covers the "nothing was due" case. */
export function SessionSummary({ kind, state, summary, canCram, onCramAgain, onBack }: SessionSummaryProps): ReactNode {
  const isEmpty = state.total === 0
  const Icon = isEmpty ? CheckCircle2 : Trophy
  const nextDue = summary.nextDue ? new Date(summary.nextDue) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground sm:p-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Icon className="size-10 text-primary" aria-hidden="true" />
        <h2 className="text-2xl font-bold tracking-tight">{isEmpty ? "All caught up!" : "Session complete"}</h2>
        <p className="text-sm text-muted-foreground">
          {isEmpty
            ? "No cards are due right now. Come back later, or cram the whole set."
            : kind === "cram"
              ? "Cram sessions don't change your review schedule."
              : "Your review schedule has been updated."}
        </p>
      </div>

      {!isEmpty && (
        <>
          <dl className="grid grid-cols-2 gap-2.5">
            <Stat label="Cards studied" value={String(state.total)} />
            <Stat label="Retention" value={`${summary.retention}%`} />
          </dl>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {pluralize(summary.reviewed, "grade")} given
            </p>
            <ul className="grid grid-cols-4 gap-2 text-center">
              {RATING_LABELS.map(({ rating, label }) => (
                <li key={rating} className="rounded-lg border border-border py-2">
                  <p className="text-lg font-semibold tabular-nums">{state.stats[rating]}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </li>
              ))}
            </ul>
          </div>

          {kind === "due" && nextDue && (
            <p className="text-center text-sm text-muted-foreground">
              Next review in <span className="font-medium text-foreground">{formatInterval(nextDue, new Date())}</span> (
              {dateFormatter.format(nextDue)})
            </p>
          )}
        </>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button className="min-h-11 sm:min-h-9" disabled={!canCram} onClick={onCramAgain}>
          Cram again
        </Button>
        <Button variant="outline" className="min-h-11 sm:min-h-9" onClick={onBack}>
          Back to set
        </Button>
      </div>
    </div>
  )
}
