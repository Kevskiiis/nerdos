import type { Folder } from "../types"

export function indexFolders(folders: readonly Folder[]): Map<string, Folder> {
  return new Map(folders.map((folder) => [folder.id, folder]))
}

/** Ids of every folder nested (at any depth) below `folderId`. */
export function getDescendantIds(folderId: string, folders: readonly Folder[]): Set<string> {
  const children = new Map<string, string[]>()
  for (const folder of folders) {
    if (folder.parentId === null) continue
    children.set(folder.parentId, [...(children.get(folder.parentId) ?? []), folder.id])
  }

  const result = new Set<string>()
  const stack = [folderId]
  while (stack.length > 0) {
    for (const childId of children.get(stack.pop() as string) ?? []) {
      if (result.has(childId)) continue
      result.add(childId)
      stack.push(childId)
    }
  }
  return result
}

/** Folders from the top level down to `folderId`. Stops safely if the data contains a cycle. */
export function getFolderPath(folderId: string | null, index: ReadonlyMap<string, Folder>): Folder[] {
  const path: Folder[] = []
  const seen = new Set<string>()
  let current = folderId ? index.get(folderId) : undefined
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current)
    current = current.parentId ? index.get(current.parentId) : undefined
  }
  return path
}

/** "CS 355 / Lectures"; empty string for the top level. */
export function formatFolderPath(folderId: string | null, index: ReadonlyMap<string, Folder>): string {
  return getFolderPath(folderId, index)
    .map((folder) => folder.name)
    .join(" / ")
}
