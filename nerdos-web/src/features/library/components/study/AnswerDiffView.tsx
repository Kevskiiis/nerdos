import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { AnswerSegment } from "../../lib/answer-diff"

function Words({ segments, tone }: { segments: readonly AnswerSegment[]; tone: "typed" | "expected" }): ReactNode {
  if (segments.length === 0) return <span className="text-muted-foreground italic">Nothing entered</span>
  return (
    <span>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(
            "rounded px-0.5",
            segment.match
              ? "bg-primary/15 text-foreground"
              : tone === "typed"
                ? "bg-destructive/15 text-destructive line-through decoration-1"
                : "bg-primary/25 font-semibold text-foreground"
          )}
        >
          {segment.text}
          {index < segments.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  )
}

interface AnswerDiffViewProps {
  typed: readonly AnswerSegment[]
  expected: readonly AnswerSegment[]
  isExact: boolean
}

/** Shows what the student typed next to the correct answer, marking matching and differing words. */
export function AnswerDiffView({ typed, expected, isExact }: AnswerDiffViewProps): ReactNode {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:text-base">
      <p className={cn("text-xs font-medium tracking-wide uppercase", isExact ? "text-primary" : "text-muted-foreground")}>
        {isExact ? "Exact match" : "Compare"}
      </p>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Your answer</p>
        <Words segments={typed} tone="typed" />
      </div>
      {!isExact && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Correct answer</p>
          <Words segments={expected} tone="expected" />
        </div>
      )}
    </div>
  )
}
