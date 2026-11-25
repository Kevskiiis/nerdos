import { useCallback, useMemo, useReducer } from "react"
import { buildStudyQueue, createSession, sessionReducer, summarizeSession, type StudyKind } from "../lib/study-session"
import { previewReviews, scheduleReview } from "../lib/scheduler"
import type { Notecard, ReviewRating } from "../types"

interface UseStudySessionArgs {
  /** Snapshot of the set's cards; the queue is built once from it when the session mounts. */
  cards: readonly Notecard[]
  kind: StudyKind
  shuffle: boolean
  /** Saves one graded review. Only called for scheduled ("due") sessions; cram never touches the schedule. */
  onPersist: (cardId: string, rating: ReviewRating, reviewedAt: string) => void
}

/**
 * Drives a study session. The session runs on a local queue so grading never waits on the
 * network; each scheduled review is saved in the background through `onPersist`.
 */
export function useStudySession({ cards, kind, shuffle, onPersist }: UseStudySessionArgs) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => {
    const now = new Date()
    return createSession(buildStudyQueue(cards, kind, now, shuffle), now.getTime())
  })

  const current = state.queue[0] ?? null

  const flip = useCallback(() => dispatch({ type: "flip" }), [])

  const grade = useCallback(
    (rating: ReviewRating) => {
      if (!current || !state.flipped) return
      const now = new Date()
      let schedule = null
      if (kind === "due") {
        schedule = scheduleReview(current.card.schedule, rating, now).schedule
        onPersist(current.card.id, rating, now.toISOString())
      }
      dispatch({ type: "grade", rating, schedule, now: now.getTime() })
    },
    [current, state.flipped, kind, onPersist]
  )

  // Interval previews only mean something when grading actually reschedules the card.
  const previews = useMemo(
    () => (current && kind === "due" ? previewReviews(current.card.schedule, new Date(state.shownAt)) : null),
    [current, kind, state.shownAt]
  )

  const summary = useMemo(() => summarizeSession(state), [state])

  return { state, current, isComplete: state.queue.length === 0, flip, grade, previews, summary }
}
