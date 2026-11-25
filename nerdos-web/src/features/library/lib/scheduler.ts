import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs"
import type { CardSchedule, CardState, ReviewRating } from "../types"

/**
 * The only module that touches `ts-fsrs`. Everything else works with serializable
 * `CardSchedule` values and `ReviewRating` strings, so the algorithm can be swapped or moved
 * server-side without touching hooks or components.
 */

// Fuzz is disabled so identical inputs always produce identical intervals.
const scheduler = fsrs({ enable_fuzz: false })

const DAY_MS = 86_400_000
const MINUTE_MS = 60_000

const GRADE_BY_RATING: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

const FSRS_STATE_BY_STATE: Record<CardState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

const STATE_BY_FSRS_STATE: Record<State, CardState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
}

export const REVIEW_RATINGS: readonly ReviewRating[] = ["again", "hard", "good", "easy"]

function toFsrsCard(schedule: CardSchedule): Card {
  return {
    due: new Date(schedule.due),
    stability: schedule.stability,
    difficulty: schedule.difficulty,
    scheduled_days: schedule.scheduledDays,
    learning_steps: schedule.learningSteps,
    reps: schedule.reps,
    lapses: schedule.lapses,
    state: FSRS_STATE_BY_STATE[schedule.state],
    last_review: schedule.lastReview ? new Date(schedule.lastReview) : undefined,
  }
}

function elapsedDaysSince(lastReview: string | undefined, now: Date): number {
  if (!lastReview) return 0
  const elapsed = (now.getTime() - new Date(lastReview).getTime()) / DAY_MS
  return Number.isFinite(elapsed) ? Math.max(0, Math.floor(elapsed)) : 0
}

function fromFsrsCard(card: Card, elapsedDays: number): CardSchedule {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_BY_FSRS_STATE[card.state],
    lastReview: card.last_review?.toISOString(),
  }
}

/** Schedule for a brand-new card: due immediately and never reviewed. */
export function createInitialSchedule(now: Date): CardSchedule {
  return fromFsrsCard(createEmptyCard(now), 0)
}

export function isDue(schedule: CardSchedule, now: Date): boolean {
  const due = Date.parse(schedule.due)
  // An unreadable date is treated as due so a card can never get stuck unreviewable.
  return Number.isNaN(due) || due <= now.getTime()
}

export interface ReviewOutcome {
  schedule: CardSchedule
  stateBefore: CardState
  elapsedDays: number
}

/** Applies one graded review and returns the card's next schedule. Pure and deterministic. */
export function scheduleReview(schedule: CardSchedule, rating: ReviewRating, now: Date): ReviewOutcome {
  const elapsedDays = elapsedDaysSince(schedule.lastReview, now)
  const { card } = scheduler.next(toFsrsCard(schedule), now, GRADE_BY_RATING[rating])
  return { schedule: fromFsrsCard(card, elapsedDays), stateBefore: schedule.state, elapsedDays }
}

export interface RatingPreview {
  schedule: CardSchedule
  /** Short label for the next interval, e.g. "10m", "3d". */
  interval: string
}

/** What each of the four grades would do, so the UI can show the next interval on every button. */
export function previewReviews(schedule: CardSchedule, now: Date): Record<ReviewRating, RatingPreview> {
  const elapsedDays = elapsedDaysSince(schedule.lastReview, now)
  const preview = scheduler.repeat(toFsrsCard(schedule), now)

  const entry = (rating: ReviewRating): RatingPreview => {
    const next = preview[GRADE_BY_RATING[rating]].card
    return { schedule: fromFsrsCard(next, elapsedDays), interval: formatInterval(next.due, now) }
  }
  return { again: entry("again"), hard: entry("hard"), good: entry("good"), easy: entry("easy") }
}

/** "<1m", "10m", "5h", "3d", "2mo", "1y": the gap between `now` and `due`, rounded to one unit. */
export function formatInterval(due: Date | string, now: Date): string {
  const diff = new Date(due).getTime() - now.getTime()
  if (!Number.isFinite(diff) || diff < MINUTE_MS) return "<1m"

  const minutes = Math.round(diff / MINUTE_MS)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.round(days / 365)}y`
}
