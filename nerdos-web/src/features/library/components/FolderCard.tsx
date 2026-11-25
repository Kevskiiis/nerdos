import type { ReactNode } from "react"
import { Folder as FolderIcon, Pin } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import type { FolderAction } from "../hooks/use-library-actions"
import { formatFolderSummary, type FolderCounts } from "../lib/browse"
import { libraryPaths } from "../routes"
import type { Folder } from "../types"
import { FolderMenu } from "./LibraryMenus"

interface FolderCardProps {
  folder: Folder
  counts: FolderCounts
  /** Parent path shown above the summary when the card appears out of context (e.g. search results). */
  location?: string
  onAction: (folder: Folder, action: FolderAction) => void
}

/** The link stretches over the whole card; the menu sits above it. */
export function FolderCard({ folder, counts, location, onAction }: FolderCardProps): ReactNode {
  return (
    <div className="relative flex min-h-16 items-center gap-1 rounded-xl border border-border bg-card pl-3 text-card-foreground transition-colors focus-within:ring-2 focus-within:ring-ring/40 hover:bg-muted/50">
      <FolderIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Link
        to={libraryPaths.folder(folder.id)}
        className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-2 outline-none after:absolute after:inset-0 after:rounded-xl"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{folder.name}</span>
          {folder.isPinned && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Pin className="size-3 fill-current" aria-hidden="true" />
              Pinned
            </Badge>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {location ? `${location} · ` : ""}
          {formatFolderSummary(counts)}
        </span>
      </Link>
      <FolderMenu
        folderName={folder.name}
        isPinned={folder.isPinned}
        onAction={(action) => onAction(folder, action)}
      />
    </div>
  )
}
