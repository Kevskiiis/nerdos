/** Single source of truth for Library URLs. */
export const libraryPaths = {
  root: "/library",
  folder: (folderId: string): string => `/library/${folderId}`,
  note: (noteId: string): string => `/library/notes/${noteId}`,
  cardSet: (setId: string): string => `/library/cards/${setId}`,
  /** Opens the set straight into a study session; `due` follows the schedule, `cram` covers every card. */
  study: (setId: string, kind: "due" | "cram" = "due"): string => `/library/cards/${setId}?study=${kind}`,
  /** Folder URL, or the Library root when `folderId` is `null`. */
  directory: (folderId: string | null): string => (folderId ? `/library/${folderId}` : "/library"),
} as const
