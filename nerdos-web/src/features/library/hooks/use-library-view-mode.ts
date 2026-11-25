import { usePersistentState } from "@/hooks/use-persistent-state"

export type LibraryViewMode = "grid" | "list"

function isViewMode(value: unknown): value is LibraryViewMode {
  return value === "grid" || value === "list"
}

/** Grid/list preference, remembered across visits. */
export function useLibraryViewMode() {
  return usePersistentState<LibraryViewMode>("nerdos:library:view-mode", "grid", isViewMode)
}
