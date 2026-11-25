import { useMemo, useState, type ReactNode } from "react"
import { FolderPlus, SearchX } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { CONTROL_HEIGHT, LibrarySearchInput, ViewToggle } from "../components/LibraryControls"
import { LibraryActionError, LibraryEmptyState, LibraryErrorState, LibraryLoadingState } from "../components/LibraryFeedback"
import { LibraryItemList } from "../components/LibraryItemList"
import { LibraryDialogHost } from "../components/dialogs/LibraryDialogHost"
import { FolderCard } from "../components/FolderCard"
import { FoldersSection } from "../components/FoldersSection"
import { NewItemMenu } from "../components/NewItemMenu"
import { UnfiledSection } from "../components/UnfiledSection"
import { useLibraryActions } from "../hooks/use-library-actions"
import { useLibraryData } from "../hooks/use-library-queries"
import { useLibraryViewMode } from "../hooks/use-library-view-mode"
import { formatFolderPath, indexFolders } from "../lib/folder-tree"
import {
  EMPTY_COUNTS,
  countFolderContents,
  filterFolders,
  filterItems,
  sortFolders,
  toLibraryItems,
  type ItemFilter,
} from "../lib/browse"

/** `/library` — folders plus unfiled quick items, with search across everything. */
export function LibraryPage(): ReactNode {
  const data = useLibraryData()
  const actions = useLibraryActions()
  const [view, setView] = useLibraryViewMode()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ItemFilter>("all")

  const { folders, pages, cardSets } = data
  const counts = useMemo(() => countFolderContents(folders ?? [], pages ?? [], cardSets ?? []), [folders, pages, cardSets])
  const folderIndex = useMemo(() => indexFolders(folders ?? []), [folders])

  if (data.isError) return <LibraryErrorState onRetry={data.refetch} />
  if (data.isPending || !folders || !pages || !cardSets) return <LibraryLoadingState />

  const isSearching = query.trim().length > 0
  const unfiled = toLibraryItems(
    pages.filter((page) => page.folderId === null),
    cardSets.filter((cardSet) => cardSet.folderId === null),
    filter
  )
  const allItems = toLibraryItems(pages, cardSets)
  const matchedFolders = sortFolders(filterFolders(folders, query))
  const matchedItems = filterItems(allItems, query)

  return (
    <PageContainer className="gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <LibrarySearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search folders, pages and card sets"
            label="Search library"
          />
          {isSearching && <ViewToggle view={view} onChange={setView} />}
          <Button variant="outline" className={CONTROL_HEIGHT} onClick={() => actions.openCreateFolder(null)}>
            <FolderPlus />
            Folder
          </Button>
          <NewItemMenu
            onNewPage={() => actions.newPage(null)}
            onNewCardSet={() => actions.newCardSet(null)}
            disabled={actions.isCreating}
          />
        </div>
        {actions.actionError && <LibraryActionError message={actions.actionError} onDismiss={actions.dismissError} />}
      </div>

      {isSearching ? (
        <div className="flex flex-col gap-6">
          {matchedFolders.length === 0 && matchedItems.length === 0 && (
            <LibraryEmptyState icon={SearchX} title="No results" description={`Nothing in your library matches "${query.trim()}".`} />
          )}
          {matchedFolders.length > 0 && (
            <section aria-label="Matching folders" className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Folders</h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchedFolders.map((folder) => (
                  <li key={folder.id} className="flex min-w-0 flex-col [&>*]:flex-1">
                    <FolderCard
                      folder={folder}
                      counts={counts.get(folder.id) ?? EMPTY_COUNTS}
                      location={formatFolderPath(folder.parentId, folderIndex)}
                      onAction={actions.onFolderAction}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {matchedItems.length > 0 && (
            <section aria-label="Matching items" className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Pages and card sets</h3>
              <LibraryItemList
                items={matchedItems}
                layout={view}
                folderLabelFor={(folderId) => (folderId ? formatFolderPath(folderId, folderIndex) : "Unfiled")}
                onAction={actions.onItemAction}
              />
            </section>
          )}
        </div>
      ) : (
        <>
          <FoldersSection
            folders={folders.filter((folder) => folder.parentId === null)}
            counts={counts}
            onAction={actions.onFolderAction}
            onCreateFolder={() => actions.openCreateFolder(null)}
          />
          <UnfiledSection
            items={unfiled}
            filter={filter}
            onFilterChange={setFilter}
            view={view}
            onViewChange={setView}
            onAction={actions.onItemAction}
          />
        </>
      )}

      <LibraryDialogHost dialog={actions.dialog} folders={folders} onClose={actions.closeDialog} />
    </PageContainer>
  )
}
