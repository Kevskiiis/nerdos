import { useEffect, useRef } from "react"
import type { ReviewRating } from "../types"

const RATING_BY_KEY: Record<string, ReviewRating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" }

interface UseStudyShortcutsArgs {
  enabled: boolean
  /** Space is only claimed when flipping is possible (and not in "type the answer" mode). */
  canFlip: boolean
  canGrade: boolean
  onFlip: () => void
  onGrade: (rating: ReviewRating) => void
}

/** True when the key press is meant for something other than the study shortcuts. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target.closest("input, textarea, select, [role=dialog], [role=listbox], [role=menu]")) return true
  // A focused button/link handles Space itself, except the flip card which expects it.
  return target.closest("button, a") !== null && target.closest("[data-study-card]") === null
}

/** Space flips the card; 1–4 grade it. Ignored while typing, in dialogs, or with modifier keys held. */
export function useStudyShortcuts({ enabled, canFlip, canGrade, onFlip, onGrade }: UseStudyShortcutsArgs): void {
  const latest = useRef({ canFlip, canGrade, onFlip, onGrade })

  useEffect(() => {
    latest.current = { canFlip, canGrade, onFlip, onGrade }
  })

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      const { canFlip, canGrade, onFlip, onGrade } = latest.current
      if (event.key === " " && canFlip) {
        event.preventDefault()
        onFlip()
        return
      }
      const rating = RATING_BY_KEY[event.key]
      if (rating && canGrade) {
        event.preventDefault()
        onGrade(rating)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled])
}
