import { useMemo } from "react"
import { useAllCards, useCardSets, useFolders, usePageSummaries, useStudyActivity } from "@/features/library/hooks/use-library-queries"
import { useNow } from "@/features/library/hooks/use-now"
import { aggregateDashboard } from "../lib/aggregate"

/** Dashboard data comes from the same repository queries as Library and Study. */
export function useDashboardData() {
  const folders = useFolders()
  const pages = usePageSummaries()
  const sets = useCardSets()
  const cards = useAllCards()
  const activity = useStudyActivity()
  const now = useNow()
  const queries = [folders, pages, sets, cards, activity]

  const data = useMemo(() => {
    if (!folders.data || !pages.data || !sets.data || !cards.data || !activity.data) return null
    return aggregateDashboard(folders.data, pages.data, sets.data, cards.data, activity.data, now)
  }, [folders.data, pages.data, sets.data, cards.data, activity.data, now])

  return {
    data,
    folders: folders.data,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    refetch: () => queries.forEach((query) => void query.refetch()),
  }
}
