import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FolderAction } from "../hooks/use-library-actions"
import { EMPTY_COUNTS, sortFolders, type FolderCounts } from "../lib/browse"
import type { Folder } from "../types"
import { FolderCard } from "./FolderCard"
import { LibraryEmptyState } from "./LibraryFeedback"

/** Folders beyond this many are tucked behind "Show all" so they never bury quick items. */
const COLLAPSED_LIMIT = 6

interface FoldersSectionProps {
  folders: readonly Folder[]
  counts: ReadonlyMap<string, FolderCounts>
  onAction: (folder: Folder, action: FolderAction) => void
  onCreateFolder: () => void
}

export function FoldersSection({ folders, counts, onAction, onCreateFolder }: FoldersSectionProps): ReactNode {
  const [expanded, setExpanded] = useState(false)
  const sorted = sortFolders(folders)
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_LIMIT)
  const hasOverflow = sorted.length > COLLAPSED_LIMIT

  return (
    <section aria-labelledby="folders-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id="folders-heading" className="text-sm font-semibold">
          Folders
        </h3>
        {hasOverflow && (
          <Button variant="ghost" size="sm" className="min-h-11 md:min-h-8" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : `Show all (${sorted.length})`}
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        )}
      </div>
      {sorted.length === 0 ? (
        <LibraryEmptyState
          icon={FolderPlus}
          title="No folders yet"
          description="Create a folder for each course or topic to keep pages and card sets together."
        >
          <Button variant="outline" className="mt-2 min-h-11 md:min-h-9" onClick={onCreateFolder}>
            <FolderPlus />
            New folder
          </Button>
        </LibraryEmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((folder) => (
            <li key={folder.id} className="flex min-w-0 flex-col [&>*]:flex-1">
              <FolderCard folder={folder} counts={counts.get(folder.id) ?? EMPTY_COUNTS} onAction={onAction} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
