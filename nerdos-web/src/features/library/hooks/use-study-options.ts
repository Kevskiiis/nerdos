import { usePersistentState } from "@/hooks/use-persistent-state"
import { DEFAULT_STUDY_OPTIONS, type StudyOptions } from "../lib/study-session"

function isStudyOptions(value: unknown): value is StudyOptions {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    (candidate.mode === "flip" || candidate.mode === "type") &&
    (candidate.direction === "forward" || candidate.direction === "reverse" || candidate.direction === "mixed") &&
    typeof candidate.shuffle === "boolean"
  )
}

/** Study preferences, remembered across sessions. */
export function useStudyOptions() {
  return usePersistentState<StudyOptions>("nerdos:library:study-options", DEFAULT_STUDY_OPTIONS, isStudyOptions)
}
