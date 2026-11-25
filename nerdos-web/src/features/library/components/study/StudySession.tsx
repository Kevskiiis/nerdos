import { useCallback, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useReviewCard } from "../../hooks/use-library-mutations"
import { useStudySession } from "../../hooks/use-study-session"
import { useStudyShortcuts } from "../../hooks/use-study-shortcuts"
import { getAnswerSide, getPromptSide, type StudyKind, type StudyOptions } from "../../lib/study-session"
import type { Notecard, ReviewRating } from "../../types"
import { LibraryActionError } from "../LibraryFeedback"
import { GradeBar } from "./GradeBar"
import { SessionSummary } from "./SessionSummary"
import { StudyCard } from "./StudyCard"
import { StudyOptionsPopover } from "./StudyOptionsPopover"

interface StudySessionProps {
  /** A concrete set for normal study, or `null` for a library-wide daily session. */
  setId: string | null
  cards: readonly Notecard[]
  kind: StudyKind
  options: StudyOptions
  onOptionsChange: (options: StudyOptions) => void
  onExit: () => void
  onCram: () => void
}

/** Distraction-free study stage. Mount with a `key` to start a fresh session. */
export function StudySession({ setId, cards, kind, options, onOptionsChange, onExit, onCram }: StudySessionProps): ReactNode {
  const [saveError, setSaveError] = useState<string | null>(null)
  const { mutate: reviewCard } = useReviewCard(setId)

  const persist = useCallback(
    (cardId: string, rating: ReviewRating, reviewedAt: string) =>
      reviewCard(
        { id: cardId, input: { rating, reviewedAt } },
        { onError: () => setSaveError("A review couldn't be saved. Check your connection; recent progress may be lost.") }
      ),
    [reviewCard]
  )

  const session = useStudySession({ cards, kind, shuffle: options.shuffle, onPersist: persist })
  const { state, current, isComplete } = session

  useStudyShortcuts({
    enabled: !isComplete,
    canFlip: !state.flipped && options.mode === "flip",
    canGrade: state.flipped,
    onFlip: session.flip,
    onGrade: session.grade,
  })

  const position = Math.min(state.completed + 1, Math.max(state.total, 1))
  const progress = state.total === 0 ? 100 : Math.round((state.completed / state.total) * 100)

  const promptSide = current ? getPromptSide(current, options.direction) : "front"
  const reviewed = session.summary.reviewed

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-14 z-[9] flex h-14 items-center gap-2 border-b border-border bg-background/95 px-2 backdrop-blur sm:px-4 md:top-12">
        <Button variant="ghost" className="min-h-11 shrink-0 px-2.5 md:min-h-8" onClick={onExit} aria-label="Exit session">
          <X />
          <span className="hidden sm:inline">Exit Session</span>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {isComplete ? "Finished" : `Card ${position} of ${state.total}`}
            {kind === "cram" && " · Cram"}
          </p>
          <Progress value={progress} aria-label="Session progress" className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        </div>
        <StudyOptionsPopover options={options} onChange={onOptionsChange} />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 pb-safe sm:py-10">
        {saveError && <LibraryActionError message={saveError} onDismiss={() => setSaveError(null)} />}

        {isComplete || !current ? (
          <SessionSummary
            kind={kind}
            state={state}
            summary={session.summary}
            canCram={cards.length > 0}
            onCramAgain={onCram}
            onBack={onExit}
          />
        ) : (
          <>
            <StudyCard
              key={`${current.card.id}:${reviewed}`}
              prompt={current.card[promptSide]}
              answer={current.card[getAnswerSide(promptSide)]}
              promptSide={promptSide}
              mode={options.mode}
              flipped={state.flipped}
              onFlip={session.flip}
            />
            {state.flipped && <GradeBar previews={session.previews} onGrade={session.grade} />}
          </>
        )}
      </div>
    </div>
  )
}
