import { useQuery } from "@tanstack/react-query"
import { libraryRepository } from "../api"

export const libraryKeys = {
  all: ["library"] as const,
  folders: () => [...libraryKeys.all, "folders"] as const,
  pages: () => [...libraryKeys.all, "pages"] as const,
  page: (id: string) => [...libraryKeys.all, "page", id] as const,
  cardSets: () => [...libraryKeys.all, "card-sets"] as const,
  cardSet: (id: string) => [...libraryKeys.all, "card-set", id] as const,
  cards: (setId: string) => [...libraryKeys.all, "cards", setId] as const,
  allCards: () => [...libraryKeys.all, "cards", "all"] as const,
  studyActivity: () => [...libraryKeys.all, "study-activity"] as const,
}

export function useFolders() {
  return useQuery({
    queryKey: libraryKeys.folders(),
    queryFn: () => libraryRepository.listFolders(),
  })
}

export function usePageSummaries() {
  return useQuery({
    queryKey: libraryKeys.pages(),
    queryFn: () => libraryRepository.listPages(),
  })
}

/** A single page including its body. `null` data means the page does not exist. */
export function usePage(id: string | undefined) {
  return useQuery({
    queryKey: libraryKeys.page(id ?? ""),
    queryFn: () => libraryRepository.getPage(id as string),
    enabled: Boolean(id),
  })
}

export function useCardSets() {
  return useQuery({
    queryKey: libraryKeys.cardSets(),
    queryFn: () => libraryRepository.listCardSets(),
  })
}

/** A single card set. `null` data means the set does not exist. */
export function useCardSet(id: string | undefined) {
  return useQuery({
    queryKey: libraryKeys.cardSet(id ?? ""),
    queryFn: () => libraryRepository.getCardSet(id as string),
    enabled: Boolean(id),
  })
}

/** Folders, page summaries and card sets together, for views that list all three. */
export function useLibraryData() {
  const folders = useFolders()
  const pages = usePageSummaries()
  const cardSets = useCardSets()
  const queries = [folders, pages, cardSets]

  return {
    folders: folders.data,
    pages: pages.data,
    cardSets: cardSets.data,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    refetch: () => queries.forEach((query) => void query.refetch()),
  }
}

export function useAllCards() {
  return useQuery({
    queryKey: libraryKeys.allCards(),
    queryFn: () => libraryRepository.listAllCards(),
  })
}

export function useStudyActivity() {
  return useQuery({
    queryKey: libraryKeys.studyActivity(),
    queryFn: () => libraryRepository.listStudyActivity(),
  })
}

/** All cards of one set. Rejects with a not-found error when the set doesn't exist. */
export function useCards(setId: string | undefined) {
  return useQuery({
    queryKey: libraryKeys.cards(setId ?? ""),
    queryFn: () => libraryRepository.listCards(setId as string),
    enabled: Boolean(setId),
  })
}
