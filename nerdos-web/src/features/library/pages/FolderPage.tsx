import { useMemo, useState, type ReactNode } from "react"
import {
  FileText,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Layers,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  SearchX,
  Trash2,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTROL_HEIGHT, LibrarySearchInput, ViewToggle } from "../components/LibraryControls"
import {
  LibraryActionError,
  LibraryEmptyState,
  LibraryErrorState,
  LibraryLoadingState,
  LibraryNotFoundState,
} from "../components/LibraryFeedback"
import { LibraryItemList } from "../components/LibraryItemList"
import { LibraryDialogHost } from "../components/dialogs/LibraryDialogHost"
import { FoldersSection } from "../components/FoldersSection"
import { ToolHeader } from "../components/ToolHeader"
import { isItemFilter } from "../components/UnfiledSection"
import { useLibraryActions } from "../hooks/use-library-actions"
import { useLibraryData } from "../hooks/use-library-queries"
import { useLibraryViewMode } from "../hooks/use-library-view-mode"
import { countFolderContents, filterItems, toLibraryItems, type ItemFilter } from "../lib/browse"
import { indexFolders } from "../lib/folder-tree"
import { libraryPaths } from "../routes"

/** `/library/:folderId` — one course folder with its pages and card sets. */
export function FolderPage(): ReactNode {
  const { folderId } = useParams<{ folderId: string }>()
  const navigate = useNavigate()
  const data = useLibraryData()
  const actions = useLibraryActions()
  const [view, setView] = useLibraryViewMode()
  const [tab, setTab] = useState<ItemFilter>("all")
  const [query, setQuery] = useState("")

  const { folders, pages, cardSets } = data
  const folder = folders?.find((candidate) => candidate.id === folderId)

  const folderPages = useMemo(() => (pages ?? []).filter((page) => page.folderId === folderId), [pages, folderId])
  const folderCardSets = useMemo(
    () => (cardSets ?? []).filter((cardSet) => cardSet.folderId === folderId),
    [cardSets, folderId]
  )
  const subfolders = useMemo(() => (folders ?? []).filter((candidate) => candidate.parentId === folderId), [folders, folderId])
  const counts = useMemo(() => countFolderContents(folders ?? [], pages ?? [], cardSets ?? []), [folders, pages, cardSets])

  if (data.isError) return <LibraryErrorState onRetry={data.refetch} />
  if (data.isPending || !folders) return <LibraryLoadingState />
  if (!folder) return <LibraryNotFoundState kind="folder" />

  const items = filterItems(toLibraryItems(folderPages, folderCardSets, tab), query)
  const hasContent = folderPages.length + folderCardSets.length > 0
  const PinIcon = folder.isPinned ? PinOff : Pin
  const parent = folder.parentId ? indexFolders(folders).get(folder.parentId) : undefined
  const backTo = libraryPaths.directory(parent?.id ?? null)

  return (
    <div className="flex flex-1 flex-col">
      <ToolHeader backTo={backTo} backLabel={parent?.name ?? "Library"} />

      <PageContainer className="gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <FolderOpen className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
            <h2 className="min-w-0 truncate text-2xl font-bold tracking-tight">{folder.name}</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-11 shrink-0 md:size-8"
              aria-label={folder.isPinned ? "Unpin folder" : "Pin folder"}
              aria-pressed={folder.isPinned}
              onClick={() => actions.onFolderAction(folder, "toggle-pin")}
            >
              <PinIcon className={folder.isPinned ? "fill-current" : undefined} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" className="size-11 shrink-0 md:size-8" aria-label="Folder actions" />}
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => actions.onFolderAction(folder, "rename")}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onFolderAction(folder, "move")}>
                  <FolderInput />
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => actions.onFolderAction(folder, "delete")}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className={CONTROL_HEIGHT} onClick={() => actions.openCreateFolder(folder.id)}>
              <FolderPlus />
              Folder
            </Button>
            <Button variant="outline" className={CONTROL_HEIGHT} disabled={actions.isCreating} onClick={() => actions.newPage(folder.id)}>
              <FileText />
              Page
            </Button>
            <Button className={CONTROL_HEIGHT} disabled={actions.isCreating} onClick={() => actions.newCardSet(folder.id)}>
              <Layers />
              Card Set
            </Button>
          </div>
        </div>

        {actions.actionError && <LibraryActionError message={actions.actionError} onDismiss={actions.dismissError} />}

        {subfolders.length > 0 && (
          <FoldersSection
            folders={subfolders}
            counts={counts}
            onAction={actions.onFolderAction}
            onCreateFolder={() => actions.openCreateFolder(folder.id)}
          />
        )}

        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isItemFilter(value)) setTab(value)
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="h-11! md:h-9!">
              <TabsTrigger value="all">All ({folderPages.length + folderCardSets.length})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({folderPages.length})</TabsTrigger>
              <TabsTrigger value="cardSets">Card Sets ({folderCardSets.length})</TabsTrigger>
            </TabsList>
            <LibrarySearchInput value={query} onChange={setQuery} placeholder="Search this folder" label="Search this folder" />
            <ViewToggle view={view} onChange={setView} />
          </div>

          <TabsContent value={tab} className="mt-3">
            {items.length > 0 ? (
              <LibraryItemList items={items} layout={view} onAction={actions.onItemAction} />
            ) : query.trim() ? (
              <LibraryEmptyState icon={SearchX} title="No results" description={`Nothing in this folder matches "${query.trim()}".`} />
            ) : (
              <LibraryEmptyState
                icon={FolderOpen}
                title={hasContent ? "Nothing here" : "No pages or card sets yet"}
                description="Add a page for notes or a card set for flashcards."
              />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>

      <LibraryDialogHost
        dialog={actions.dialog}
        folders={folders}
        onClose={actions.closeDialog}
        onFolderDeleted={() => navigate(backTo, { replace: true })}
      />
    </div>
  )
}
