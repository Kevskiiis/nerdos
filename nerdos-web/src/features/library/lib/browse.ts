import type { Folder, LibraryItem, NotecardSet, PageSummary } from "../types"

export type ItemFilter = "all" | "pages" | "cardSets"

export interface FolderCounts {
  folders: number
  pages: number
  cardSets: number
}

export const EMPTY_COUNTS: FolderCounts = { folders: 0, pages: 0, cardSets: 0 }

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true })
}

/** Pinned folders first, then alphabetical. */
export function sortFolders(folders: readonly Folder[]): Folder[] {
  return [...folders].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || compareText(a.name, b.name))
}

/** Direct children of each folder (not recursive). */
export function countFolderContents(
  folders: readonly Folder[],
  pages: readonly PageSummary[],
  cardSets: readonly NotecardSet[]
): Map<string, FolderCounts> {
  const counts = new Map<string, FolderCounts>()
  const bump = (folderId: string | null, key: keyof FolderCounts) => {
    if (folderId === null) return
    const current = counts.get(folderId) ?? EMPTY_COUNTS
    counts.set(folderId, { ...current, [key]: current[key] + 1 })
  }
  for (const folder of folders) bump(folder.parentId, "folders")
  for (const page of pages) bump(page.folderId, "pages")
  for (const cardSet of cardSets) bump(cardSet.folderId, "cardSets")
  return counts
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatFolderSummary(counts: FolderCounts): string {
  if (counts.folders + counts.pages + counts.cardSets === 0) return "Empty"
  const parts = [pluralize(counts.pages, "page"), pluralize(counts.cardSets, "card set")]
  if (counts.folders > 0) parts.unshift(pluralize(counts.folders, "folder"))
  return parts.join(" · ")
}

/** Pages and card sets merged into one list, most recently updated first. */
export function toLibraryItems(
  pages: readonly PageSummary[],
  cardSets: readonly NotecardSet[],
  filter: ItemFilter = "all"
): LibraryItem[] {
  const items: LibraryItem[] = []
  if (filter !== "cardSets") for (const item of pages) items.push({ kind: "page", item })
  if (filter !== "pages") for (const item of cardSets) items.push({ kind: "cardSet", item })
  return items.sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt))
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function matchesQuery(query: string, ...fields: string[]): boolean {
  const needle = normalize(query)
  if (!needle) return true
  return fields.some((field) => field.toLowerCase().includes(needle))
}

export function filterItems(items: readonly LibraryItem[], query: string): LibraryItem[] {
  return items.filter((entry) =>
    entry.kind === "page"
      ? matchesQuery(query, entry.item.title, entry.item.excerpt)
      : matchesQuery(query, entry.item.title, entry.item.description)
  )
}

export function filterFolders(folders: readonly Folder[], query: string): Folder[] {
  return folders.filter((folder) => matchesQuery(query, folder.name))
}
