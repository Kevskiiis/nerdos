import type { ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PageContainer } from "@/components/layout/PageContainer"
import { EditorMount } from "../components/EditorMount"
import { LibraryErrorState, LibraryLoadingState, LibraryNotFoundState } from "../components/LibraryFeedback"
import { ItemMenu } from "../components/LibraryMenus"
import { LibraryDialogHost } from "../components/dialogs/LibraryDialogHost"
import { PageTitleInput } from "../components/PageTitleInput"
import { SaveStatusIndicator } from "../components/SaveStatusIndicator"
import { ToolHeader } from "../components/ToolHeader"
import { useAutosavePage } from "../hooks/use-autosave-page"
import { useLibraryActions } from "../hooks/use-library-actions"
import { useFolders, usePage } from "../hooks/use-library-queries"
import { displayTitle, formatDate } from "../lib/format"
import { formatFolderPath, indexFolders } from "../lib/folder-tree"
import { libraryPaths } from "../routes"
import type { Folder, Page } from "../types"

interface NoteDocumentProps {
  page: Page
  folders: readonly Folder[]
}

function NoteDocument({ page, folders }: NoteDocumentProps): ReactNode {
  const navigate = useNavigate()
  const actions = useLibraryActions()
  const { draft, status, update, retry } = useAutosavePage(page)

  const folder = folders.find((candidate) => candidate.id === page.folderId)
  const folderName = folder?.name ?? "Library"
  const location = folder ? formatFolderPath(folder.id, indexFolders(folders)) : "Unfiled"

  return (
    <div className="flex flex-1 flex-col">
      <ToolHeader
        backTo={libraryPaths.directory(page.folderId)}
        backLabel={folderName}
        title={displayTitle(draft.title)}
        actions={
          <>
            <SaveStatusIndicator status={status} onRetry={retry} />
            <ItemMenu entry={{ kind: "page", item: page }} onAction={(entry, action) => actions.onItemAction(entry, action)} />
          </>
        }
      />

      <PageContainer className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 md:py-10">
        <PageTitleInput value={draft.title} onChange={(title) => update({ title })} />
        <p className="mt-2 text-xs text-muted-foreground">
          Updated {formatDate(page.updatedAt)} · {location}
        </p>
        <EditorMount value={page.content} onChange={(content) => update({ content })} />
      </PageContainer>

      <LibraryDialogHost
        dialog={actions.dialog}
        folders={folders}
        onClose={actions.closeDialog}
        onItemDeleted={() => navigate(libraryPaths.directory(page.folderId), { replace: true })}
      />
    </div>
  )
}

/** `/library/notes/:noteId` — full-canvas Plate document bound to `page.content`. */
export function NotePage(): ReactNode {
  const { noteId } = useParams<{ noteId: string }>()
  const pageQuery = usePage(noteId)
  const foldersQuery = useFolders()

  if (pageQuery.isError || foldersQuery.isError) {
    return (
      <LibraryErrorState
        onRetry={() => {
          void pageQuery.refetch()
          void foldersQuery.refetch()
        }}
      />
    )
  }
  if (pageQuery.isPending || foldersQuery.isPending) return <LibraryLoadingState />
  if (!pageQuery.data) return <LibraryNotFoundState kind="page" />

  // Keyed by id so navigating between pages always starts from a fresh draft.
  return <NoteDocument key={pageQuery.data.id} page={pageQuery.data} folders={foldersQuery.data} />
}
