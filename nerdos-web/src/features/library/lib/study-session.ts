import type { CardSchedule, Notecard, ReviewRating } from "../types"
import { isDue } from "./scheduler"

export type StudyKind = "due" | "cram"
export type StudyMode = "flip" | "type"
export type StudyDirection = "forward" | "reverse" | "mixed"
export type CardSide = "front" | "back"

export interface StudyOptions {
  mode: StudyMode
  direction: StudyDirection
  shuffle: boolean
}

export const DEFAULT_STUDY_OPTIONS: StudyOptions = { mode: "flip", direction: "forward", shuffle: true }

export interface QueueItem {
  card: Notecard
  /** Decides the prompt side when the direction is "mixed". */
  reversed: boolean
}

type Rng = () => number

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

/** Due sessions take only cards whose review is due (oldest first); cram takes every card. */
export function buildStudyQueue(
  cards: readonly Notecard[],
  kind: StudyKind,
  now: Date,
  shuffle: boolean,
  rng: Rng = Math.random
): QueueItem[] {
  const eligible =
    kind === "due"
      ? cards.filter((card) => isDue(card.schedule, now)).sort((a, b) => a.schedule.due.localeCompare(b.schedule.due))
      : [...cards]
  const ordered = shuffle ? shuffled(eligible, rng) : eligible
  return ordered.map((card) => ({ card, reversed: rng() < 0.5 }))
}

/** The side shown as the question for this item. */
export function getPromptSide(item: QueueItem, direction: StudyDirection): CardSide {
  if (direction === "forward") return "front"
  if (direction === "reverse") return "back"
  return item.reversed ? "back" : "front"
}

export function getAnswerSide(prompt: CardSide): CardSide {
  return prompt === "front" ? "back" : "front"
}

/** After "Again" a card comes back once this many other cards have been shown. */
export const REQUEUE_GAP = 3

export interface SessionState {
  queue: QueueItem[]
  /** Distinct cards in the session when it started. */
  total: number
  /** Distinct cards finished (graded Hard, Good or Easy). */
  completed: number
  flipped: boolean
  stats: Record<ReviewRating, number>
  /** Latest schedule per card; only filled for scheduled ("due") sessions. */
  schedules: Record<string, CardSchedule>
  /** When the current card appeared; the time base for interval previews. */
  shownAt: number
}

export type SessionAction =
  | { type: "flip" }
  | { type: "grade"; rating: ReviewRating; schedule: CardSchedule | null; now: number }

export function createSession(queue: QueueItem[], now: number): SessionState {
  return {
    queue,
    total: queue.length,
    completed: 0,
    flipped: false,
    stats: { again: 0, hard: 0, good: 0, easy: 0 },
    schedules: {},
    shownAt: now,
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === "flip") return state.flipped || state.queue.length === 0 ? state : { ...state, flipped: true }

  const [current, ...rest] = state.queue
  if (!current || !state.flipped) return state

  const card = action.schedule ? { ...current.card, schedule: action.schedule } : current.card
  const requeue = action.rating === "again"
  const queue = requeue
    ? [...rest.slice(0, REQUEUE_GAP), { ...current, card }, ...rest.slice(REQUEUE_GAP)]
    : rest

  return {
    ...state,
    queue,
    completed: requeue ? state.completed : state.completed + 1,
    flipped: false,
    stats: { ...state.stats, [action.rating]: state.stats[action.rating] + 1 },
    schedules: action.schedule ? { ...state.schedules, [card.id]: action.schedule } : state.schedules,
    shownAt: action.now,
  }
}

export interface SessionSummary {
  reviewed: number
  /** Share of grades that were not "Again", 0–100. */
  retention: number
  /** Earliest upcoming review among the cards graded in a scheduled session. */
  nextDue: string | null
}

export function summarizeSession(state: SessionState): SessionSummary {
  const reviewed = state.stats.again + state.stats.hard + state.stats.good + state.stats.easy
  const recalled = reviewed - state.stats.again
  const dues = Object.values(state.schedules).map((schedule) => schedule.due)
  return {
    reviewed,
    retention: reviewed === 0 ? 0 : Math.round((recalled / reviewed) * 100),
    nextDue: dues.length > 0 ? dues.reduce((earliest, due) => (due < earliest ? due : earliest)) : null,
  }
}
