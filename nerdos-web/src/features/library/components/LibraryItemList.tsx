import type { ReactNode } from "react"
import type { ItemAction } from "../hooks/use-library-actions"
import type { LibraryViewMode } from "../hooks/use-library-view-mode"
import type { LibraryItem } from "../types"
import { CardSetCard, PageCard } from "./ItemCards"

interface LibraryItemListProps {
  items: readonly LibraryItem[]
  layout: LibraryViewMode
  /** Maps a folder id to its display name; only passed when items from several folders are mixed. */
  folderLabelFor?: (folderId: string | null) => string | undefined
  onAction: (entry: LibraryItem, action: ItemAction) => void
}

/** Grid or single-column list of pages and card sets. */
export function LibraryItemList({ items, layout, folderLabelFor, onAction }: LibraryItemListProps): ReactNode {
  const className =
    layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"

  return (
    <ul className={className}>
      {items.map((entry) => {
        const folderLabel = folderLabelFor?.(entry.item.folderId)
        return (
          <li key={`${entry.kind}-${entry.item.id}`} className="flex min-w-0 flex-col [&>*]:flex-1">
            {entry.kind === "page" ? (
              <PageCard item={entry.item} layout={layout} folderLabel={folderLabel} onAction={onAction} />
            ) : (
              <CardSetCard item={entry.item} layout={layout} folderLabel={folderLabel} onAction={onAction} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
