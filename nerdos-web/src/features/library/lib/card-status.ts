import type { CardSchedule, Notecard } from "../types"
import { isDue } from "./scheduler"

export type CardStatus = "new" | "due" | "learning" | "mastered"

/** A review card is "mastered" once FSRS expects to remember it for about three weeks. */
export const MASTERED_STABILITY_DAYS = 21

export interface MasteryBreakdown {
  new: number
  learning: number
  mastered: number
}

function isMastered(schedule: CardSchedule): boolean {
  return schedule.state === "review" && schedule.stability >= MASTERED_STABILITY_DAYS
}

export function getCardStatus(schedule: CardSchedule, now: Date): CardStatus {
  if (schedule.state === "new") return "new"
  if (isDue(schedule, now)) return "due"
  return isMastered(schedule) ? "mastered" : "learning"
}

/** Every card lands in exactly one bucket, so the three counts always sum to the card total. */
export function getMasteryBreakdown(cards: readonly Notecard[]): MasteryBreakdown {
  const breakdown: MasteryBreakdown = { new: 0, learning: 0, mastered: 0 }
  for (const { schedule } of cards) {
    if (schedule.state === "new") breakdown.new++
    else if (isMastered(schedule)) breakdown.mastered++
    else breakdown.learning++
  }
  return breakdown
}

export function countDue(cards: readonly Notecard[], now: Date): number {
  return cards.filter((card) => isDue(card.schedule, now)).length
}

export function matchesCardQuery(card: Notecard, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return card.front.toLowerCase().includes(needle) || card.back.toLowerCase().includes(needle)
}
