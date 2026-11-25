import { useMemo, type ReactNode } from "react"
import type { LibraryDialogState } from "../../hooks/use-library-actions"
import {
  useCreateFolder,
  useDeleteCardSet,
  useDeleteFolder,
  useDeletePage,
  useResetCardSet,
  useUpdateCardSet,
  useUpdateFolder,
  useUpdatePage,
} from "../../hooks/use-library-mutations"
import { displayTitle } from "../../lib/format"
import { getDescendantIds } from "../../lib/folder-tree"
import type { Folder } from "../../types"
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog"
import { MoveToDialog } from "./MoveToDialog"
import { NameDialog } from "./NameDialog"

interface LibraryDialogHostProps {
  dialog: LibraryDialogState
  folders: readonly Folder[]
  onClose: () => void
  /** Fired after an item is deleted so a view of that item can navigate away. */
  onItemDeleted?: () => void
  /** Fired after a folder is deleted so a view of that folder can navigate away. */
  onFolderDeleted?: () => void
}

/** Folders a folder may not be moved into: itself and everything nested below it. */
function useMoveExclusions(dialog: LibraryDialogState, folders: readonly Folder[]): ReadonlySet<string> | undefined {
  const movingId = dialog?.kind === "move-folder" ? dialog.folder.id : null
  return useMemo(() => {
    if (!movingId) return undefined
    const excluded = getDescendantIds(movingId, folders)
    excluded.add(movingId)
    return excluded
  }, [movingId, folders])
}

/** Renders whichever modal the actions hook has opened. Each dialog mounts fresh per open. */
export function LibraryDialogHost({
  dialog,
  folders,
  onClose,
  onItemDeleted,
  onFolderDeleted,
}: LibraryDialogHostProps): ReactNode {
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()
  const updatePage = useUpdatePage()
  const deletePage = useDeletePage()
  const updateCardSet = useUpdateCardSet()
  const deleteCardSet = useDeleteCardSet()
  const resetCardSet = useResetCardSet()
  const moveExclusions = useMoveExclusions(dialog, folders)

  if (!dialog) return null

  switch (dialog.kind) {
    case "create-folder":
      return (
        <NameDialog
          title="New folder"
          description={
            dialog.parentId
              ? "Create a subfolder to organize this folder further."
              : "Group related pages and card sets, like a course or topic."
          }
          submitLabel="Create folder"
          fieldLabel="Folder name"
          onSubmit={async (name) => {
            await createFolder.mutateAsync({ name, parentId: dialog.parentId })
            onClose()
          }}
          onClose={onClose}
        />
      )

    case "rename-folder":
      return (
        <NameDialog
          title="Rename folder"
          description="Choose a new name for this folder."
          submitLabel="Save"
          fieldLabel="Folder name"
          initialName={dialog.folder.name}
          onSubmit={async (name) => {
            await updateFolder.mutateAsync({ id: dialog.folder.id, patch: { name } })
            onClose()
          }}
          onClose={onClose}
        />
      )

    case "move-folder":
      return (
        <MoveToDialog
          title={`Move "${dialog.folder.name}"`}
          folders={folders}
          excludedIds={moveExclusions}
          rootLabel="Library (top level)"
          currentFolderId={dialog.folder.parentId}
          onSelect={async (parentId) => {
            await updateFolder.mutateAsync({ id: dialog.folder.id, patch: { parentId } })
            onClose()
          }}
          onClose={onClose}
        />
      )

    case "rename-card-set":
      return (
        <NameDialog
          title="Rename card set"
          description="Choose a new name for this card set."
          submitLabel="Save"
          fieldLabel="Card set name"
          initialName={dialog.entry.item.title}
          onSubmit={async (title) => {
            await updateCardSet.mutateAsync({ id: dialog.entry.item.id, patch: { title } })
            onClose()
          }}
          onClose={onClose}
        />
      )

    case "reset-card-set":
      return (
        <ConfirmDeleteDialog
          title={`Reset progress for "${displayTitle(dialog.entry.item.title)}"?`}
          description="Every card goes back to new and its review history is cleared. The cards themselves are kept."
          confirmLabel="Reset progress"
          onConfirm={async () => {
            await resetCardSet.mutateAsync(dialog.entry.item.id)
            onClose()
          }}
          onClose={onClose}
        />
      )

    case "delete-folder":
      return (
        <ConfirmDeleteDialog
          title={`Delete "${dialog.folder.name}"?`}
          description="This also deletes its subfolders and every page and card set inside. This can't be undone."
          onConfirm={async () => {
            await deleteFolder.mutateAsync(dialog.folder.id)
            onClose()
            onFolderDeleted?.()
          }}
          onClose={onClose}
        />
      )

    case "delete-item": {
      const { entry } = dialog
      return (
        <ConfirmDeleteDialog
          title={`Delete "${displayTitle(entry.item.title)}"?`}
          description={
            entry.kind === "page"
              ? "This page will be permanently deleted."
              : "This card set and its cards will be permanently deleted."
          }
          onConfirm={async () => {
            if (entry.kind === "page") await deletePage.mutateAsync(entry.item.id)
            else await deleteCardSet.mutateAsync(entry.item.id)
            onClose()
            onItemDeleted?.()
          }}
          onClose={onClose}
        />
      )
    }

    case "move-item": {
      const { entry } = dialog
      return (
        <MoveToDialog
          title={`Move "${displayTitle(entry.item.title)}"`}
          folders={folders}
          rootLabel="Library (unfiled)"
          currentFolderId={entry.item.folderId}
          onSelect={async (folderId) => {
            if (entry.kind === "page") await updatePage.mutateAsync({ id: entry.item.id, patch: { folderId } })
            else await updateCardSet.mutateAsync({ id: entry.item.id, patch: { folderId } })
            onClose()
          }}
          onClose={onClose}
        />
      )
    }
  }
}
