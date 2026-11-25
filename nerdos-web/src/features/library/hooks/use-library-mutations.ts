import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { libraryRepository } from "../api"
import type {
  CreateCardInput,
  CreateCardSetInput,
  CreateFolderInput,
  CreatePageInput,
  Folder,
  ReviewCardInput,
  UpdateCardInput,
  UpdateCardSetInput,
  UpdateFolderInput,
  UpdatePageInput,
} from "../types"
import { libraryKeys } from "./use-library-queries"

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFolderInput) => libraryRepository.createFolder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: libraryKeys.folders() }),
  })
}

/** Optimistic: renames and pins appear instantly and roll back if the write fails. */
export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateFolderInput }) =>
      libraryRepository.updateFolder(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.folders() })
      const previous = queryClient.getQueryData<Folder[]>(libraryKeys.folders())
      queryClient.setQueryData<Folder[]>(libraryKeys.folders(), (folders) =>
        folders?.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder))
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(libraryKeys.folders(), context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: libraryKeys.folders() }),
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => libraryRepository.deleteFolder(id),
    // Deleting a folder cascades to its pages and card sets.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePageInput) => libraryRepository.createPage(input),
    onSuccess: (page) => {
      queryClient.setQueryData(libraryKeys.page(page.id), page)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.pages() })
    },
  })
}

/** Used for autosave (title/body) and for moving a page between folders. */
export function useUpdatePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePageInput }) =>
      libraryRepository.updatePage(id, patch),
    onSuccess: (page) => {
      queryClient.setQueryData(libraryKeys.page(page.id), page)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.pages() })
    },
  })
}

export function useDuplicatePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => libraryRepository.duplicatePage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: libraryKeys.pages() }),
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => libraryRepository.deletePage(id),
    onSuccess: (_result, id) => {
      // Cache the deletion so a lingering view of this page resolves to "not found" without refetching.
      queryClient.setQueryData(libraryKeys.page(id), null)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.pages() })
    },
  })
}

export function useCreateCardSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCardSetInput) => libraryRepository.createCardSet(input),
    onSuccess: (cardSet) => {
      queryClient.setQueryData(libraryKeys.cardSet(cardSet.id), cardSet)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.cardSets() })
    },
  })
}

export function useUpdateCardSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateCardSetInput }) =>
      libraryRepository.updateCardSet(id, patch),
    onSuccess: (cardSet) => {
      queryClient.setQueryData(libraryKeys.cardSet(cardSet.id), cardSet)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.cardSets() })
    },
  })
}

export function useDeleteCardSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => libraryRepository.deleteCardSet(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData(libraryKeys.cardSet(id), null)
      return queryClient.invalidateQueries({ queryKey: libraryKeys.cardSets() })
    },
  })
}

/** Card edits change a set's `cardCount` / `dueCount`, so the set queries refresh with the cards. */
function invalidateCardData(queryClient: QueryClient, setId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: libraryKeys.cards(setId) }),
    queryClient.invalidateQueries({ queryKey: libraryKeys.allCards() }),
    queryClient.invalidateQueries({ queryKey: libraryKeys.cardSets() }),
    queryClient.invalidateQueries({ queryKey: libraryKeys.cardSet(setId) }),
  ])
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCardInput) => libraryRepository.createCard(input),
    onSuccess: (card) => invalidateCardData(queryClient, card.setId),
  })
}

export function useUpdateCard(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateCardInput }) => libraryRepository.updateCard(id, patch),
    onSuccess: () => invalidateCardData(queryClient, setId),
  })
}

export function useDeleteCard(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => libraryRepository.deleteCard(id),
    onSuccess: () => invalidateCardData(queryClient, setId),
  })
}

/** Persists one graded review. `setId` is `null` for a cross-set daily session. */
export function useReviewCard(setId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewCardInput }) => libraryRepository.reviewCard(id, input),
    onSettled: async () => {
      if (setId) await invalidateCardData(queryClient, setId)
      else await queryClient.invalidateQueries({ queryKey: libraryKeys.all })
      await queryClient.invalidateQueries({ queryKey: libraryKeys.studyActivity() })
    },
  })
}

export function useResetCardSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => libraryRepository.resetCardSetProgress(setId),
    onSuccess: (_result, setId) => invalidateCardData(queryClient, setId),
  })
}
