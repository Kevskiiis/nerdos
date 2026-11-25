import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Folder, LibraryItem } from "../types"
import { getErrorMessage } from "../lib/errors"
import { libraryPaths } from "../routes"
import { useCreateCardSet, useCreatePage, useDuplicatePage, useUpdateFolder } from "./use-library-mutations"

export type FolderAction = "toggle-pin" | "rename" | "move" | "delete"
export type ItemAction = "move" | "duplicate" | "rename" | "reset" | "delete"

/** Which modal (if any) is open. Discriminated so the dialog host can render each case type-safely. */
export type LibraryDialogState =
  | null
  | { kind: "create-folder"; parentId: string | null }
  | { kind: "rename-folder"; folder: Folder }
  | { kind: "move-folder"; folder: Folder }
  | { kind: "delete-folder"; folder: Folder }
  | { kind: "rename-card-set"; entry: Extract<LibraryItem, { kind: "cardSet" }> }
  | { kind: "reset-card-set"; entry: Extract<LibraryItem, { kind: "cardSet" }> }
  | { kind: "move-item"; entry: LibraryItem }
  | { kind: "delete-item"; entry: LibraryItem }

/** Routes menu and toolbar actions to either an immediate mutation or a confirmation/input dialog. */
export function useLibraryActions() {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<LibraryDialogState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { mutate: updateFolder } = useUpdateFolder()
  const { mutate: duplicatePage } = useDuplicatePage()
  const { mutate: createPage, isPending: isCreatingPage } = useCreatePage()
  const { mutate: createCardSet, isPending: isCreatingCardSet } = useCreateCardSet()

  const closeDialog = useCallback(() => setDialog(null), [])
  const dismissError = useCallback(() => setActionError(null), [])
  const fail = useCallback((error: unknown) => setActionError(getErrorMessage(error)), [])

  /** `parentId` is the folder to create inside, or `null` for the top level. */
  const openCreateFolder = useCallback((parentId: string | null) => setDialog({ kind: "create-folder", parentId }), [])

  /** Creates an empty page in `folderId` (or unfiled) and opens it. */
  const newPage = useCallback(
    (folderId: string | null) => {
      setActionError(null)
      createPage({ folderId }, { onSuccess: (page) => navigate(libraryPaths.note(page.id)), onError: fail })
    },
    [createPage, fail, navigate]
  )

  const newCardSet = useCallback(
    (folderId: string | null) => {
      setActionError(null)
      createCardSet(
        { folderId, title: "Untitled card set" },
        { onSuccess: (cardSet) => navigate(libraryPaths.cardSet(cardSet.id)), onError: fail }
      )
    },
    [createCardSet, fail, navigate]
  )

  const onFolderAction = useCallback(
    (folder: Folder, action: FolderAction) => {
      setActionError(null)
      switch (action) {
        case "toggle-pin":
          updateFolder({ id: folder.id, patch: { isPinned: !folder.isPinned } }, { onError: fail })
          return
        case "rename":
          setDialog({ kind: "rename-folder", folder })
          return
        case "move":
          setDialog({ kind: "move-folder", folder })
          return
        case "delete":
          setDialog({ kind: "delete-folder", folder })
          return
      }
    },
    [fail, updateFolder]
  )

  const onItemAction = useCallback(
    (entry: LibraryItem, action: ItemAction) => {
      setActionError(null)
      switch (action) {
        case "duplicate":
          if (entry.kind === "page") duplicatePage(entry.item.id, { onError: fail })
          return
        case "rename":
          if (entry.kind === "cardSet") setDialog({ kind: "rename-card-set", entry })
          return
        case "reset":
          if (entry.kind === "cardSet") setDialog({ kind: "reset-card-set", entry })
          return
        case "move":
          setDialog({ kind: "move-item", entry })
          return
        case "delete":
          setDialog({ kind: "delete-item", entry })
          return
      }
    },
    [duplicatePage, fail]
  )

  return {
    dialog,
    closeDialog,
    actionError,
    dismissError,
    fail,
    openCreateFolder,
    newPage,
    newCardSet,
    isCreating: isCreatingPage || isCreatingCardSet,
    onFolderAction,
    onItemAction,
  }
}
