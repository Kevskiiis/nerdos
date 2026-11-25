import { useMemo, useState, type ReactNode } from "react"
import { Check, Folder as FolderIcon, Library } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { compareText } from "../../lib/browse"
import { getErrorMessage } from "../../lib/errors"
import { formatFolderPath, indexFolders } from "../../lib/folder-tree"
import type { Folder } from "../../types"

interface MoveToDialogProps {
  title: string
  folders: readonly Folder[]
  /** Folders that are not valid destinations (e.g. a folder and its own subfolders). */
  excludedIds?: ReadonlySet<string>
  /** Label of the top-level destination, e.g. "Library (unfiled)" for items. */
  rootLabel: string
  /** Where the item currently lives; shown as the current location and not selectable. */
  currentFolderId: string | null
  onSelect: (folderId: string | null) => Promise<void>
  onClose: () => void
}

interface Destination {
  id: string | null
  /** Full path, e.g. "CS 355 / Lectures". */
  path: string
}

/** Searchable destination picker listing every folder with its full path. */
export function MoveToDialog({
  title,
  folders,
  excludedIds,
  rootLabel,
  currentFolderId,
  onSelect,
  onClose,
}: MoveToDialogProps): ReactNode {
  const [error, setError] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const destinations = useMemo<Destination[]>(() => {
    const index = indexFolders(folders)
    const nested = folders
      .filter((folder) => !excludedIds?.has(folder.id))
      .map<Destination>((folder) => ({ id: folder.id, path: formatFolderPath(folder.id, index) }))
      .sort((a, b) => compareText(a.path, b.path))
    return [{ id: null, path: rootLabel }, ...nested]
  }, [folders, excludedIds, rootLabel])

  const handleSelect = async (destination: Destination) => {
    if (isMoving || destination.id === currentFolderId) return
    setIsMoving(true)
    setError(null)
    try {
      await onSelect(destination.id)
    } catch (caught) {
      setError(getErrorMessage(caught))
      setIsMoving(false)
    }
  }

  return (
    <CommandDialog open onOpenChange={(open) => !open && onClose()} title={title} description="Choose a destination folder">
      <Command>
        <CommandInput placeholder="Search folders..." />
        <CommandList>
          <CommandEmpty>No folders found.</CommandEmpty>
          <CommandGroup heading={title}>
            {destinations.map((destination) => {
              const isCurrent = destination.id === currentFolderId
              return (
                <CommandItem
                  key={destination.id ?? "root"}
                  value={destination.id ?? "root"}
                  keywords={[destination.path]}
                  disabled={isCurrent || isMoving}
                  onSelect={() => void handleSelect(destination)}
                  className="min-h-11 md:min-h-9"
                >
                  {destination.id === null ? <Library /> : <FolderIcon />}
                  <span className="min-w-0 flex-1 truncate">{destination.path}</span>
                  {isCurrent && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Check className="size-3.5" /> Current
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
        {error && (
          <p role="alert" className="px-4 pb-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </Command>
    </CommandDialog>
  )
}
