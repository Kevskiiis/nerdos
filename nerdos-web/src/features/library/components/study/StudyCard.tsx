import { useMemo, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { diffAnswer } from "../../lib/answer-diff"
import type { CardSide, StudyMode } from "../../lib/study-session"
import { RichText } from "../cards/RichText"
import { AnswerDiffView } from "./AnswerDiffView"

const SIDE_LABEL: Record<CardSide, string> = { front: "Front", back: "Back" }

interface StudyCardProps {
  prompt: string
  answer: string
  promptSide: CardSide
  mode: StudyMode
  flipped: boolean
  onFlip: () => void
}

const SURFACE_CLASS =
  "flex min-h-64 w-full flex-col justify-between rounded-xl border border-border bg-card p-6 text-left text-card-foreground sm:min-h-80 sm:p-10"

/** One flashcard. Mounted per card display (keyed by the parent), so typed input resets each time. */
export function StudyCard({ prompt, answer, promptSide, mode, flipped, onFlip }: StudyCardProps): ReactNode {
  const [typed, setTyped] = useState("")
  const answerSide: CardSide = promptSide === "front" ? "back" : "front"
  const diff = useMemo(() => (mode === "type" && flipped ? diffAnswer(typed, answer) : null), [mode, flipped, typed, answer])

  const sideLabel = (
    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
      {SIDE_LABEL[flipped ? answerSide : promptSide]}
    </p>
  )

  const body = (
    <div className="my-6 flex flex-1 flex-col justify-center gap-5">
      {flipped ? (
        <>
          <RichText text={prompt} className="text-sm text-muted-foreground sm:text-base" />
          <hr className="border-border" />
          <RichText text={answer} className="text-xl font-medium sm:text-2xl" />
          {diff && <AnswerDiffView {...diff} />}
        </>
      ) : (
        <RichText text={prompt} className="text-xl font-medium sm:text-2xl" />
      )}
    </div>
  )

  if (flipped) {
    return (
      <div className={SURFACE_CLASS}>
        {sideLabel}
        {body}
        <p className="text-xs text-muted-foreground">How well did you remember it?</p>
      </div>
    )
  }

  if (mode === "type") {
    return (
      <form
        className={SURFACE_CLASS}
        onSubmit={(event) => {
          event.preventDefault()
          onFlip()
        }}
      >
        {sideLabel}
        {body}
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                onFlip()
              }
            }}
            rows={2}
            placeholder="Type your answer"
            aria-label="Your answer"
            className="min-h-16 resize-none text-base"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="hidden text-xs text-muted-foreground sm:block">Enter to check · Shift + Enter for a new line</p>
            <Button type="submit" className="min-h-11 w-full sm:ml-auto sm:min-h-9 sm:w-auto">
              Check answer
            </Button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <button
      type="button"
      data-study-card
      onClick={onFlip}
      aria-label="Flip card to reveal the answer"
      className={cn(SURFACE_CLASS, "cursor-pointer transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50")}
    >
      {sideLabel}
      {body}
      <p className="text-xs text-muted-foreground">
        <span className="sm:hidden">Tap to flip</span>
        <span className="hidden sm:inline">Click or press Space to flip</span>
      </p>
    </button>
  )
}
