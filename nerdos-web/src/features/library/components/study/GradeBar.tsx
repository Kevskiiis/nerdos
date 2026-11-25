import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { REVIEW_RATINGS, type RatingPreview } from "../../lib/scheduler"
import type { ReviewRating } from "../../types"

const RATING_VIEW: Record<ReviewRating, { label: string; key: string; className?: string }> = {
  again: { label: "Again", key: "1", className: "border-destructive/40 text-destructive hover:bg-destructive/10" },
  hard: { label: "Hard", key: "2" },
  good: { label: "Good", key: "3" },
  easy: { label: "Easy", key: "4" },
}

interface GradeBarProps {
  /** Next interval for each grade; `null` in cram mode where grading doesn't reschedule. */
  previews: Record<ReviewRating, RatingPreview> | null
  onGrade: (rating: ReviewRating) => void
}

/** The four recall grades, each with its keyboard shortcut and the interval it would schedule. */
export function GradeBar({ previews, onGrade }: GradeBarProps): ReactNode {
  return (
    <div role="group" aria-label="How well did you remember?" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {REVIEW_RATINGS.map((rating) => {
        const { label, key, className } = RATING_VIEW[rating]
        return (
          <Button
            key={rating}
            type="button"
            variant={rating === "good" ? "default" : "outline"}
            className={cn("h-auto min-h-16 flex-col gap-0.5 py-2", className)}
            onClick={() => onGrade(rating)}
          >
            <span className="text-sm font-semibold">{label}</span>
            {previews && <span className="text-xs opacity-80">{previews[rating].interval}</span>}
            <kbd className="mt-0.5 rounded border border-current/30 px-1.5 text-[10px] leading-4 opacity-70">{key}</kbd>
          </Button>
        )
      })}
    </div>
  )
}
