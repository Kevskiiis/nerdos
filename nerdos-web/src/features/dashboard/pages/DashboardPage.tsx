import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { PageContainer } from "@/components/layout/PageContainer"
import { LibraryActionError, LibraryErrorState } from "@/features/library/components/LibraryFeedback"
import { useCreateCardSet, useCreatePage } from "@/features/library/hooks/use-library-mutations"
import { getErrorMessage } from "@/features/library/lib/errors"
import { libraryPaths } from "@/features/library/routes"
import { ConsistencyCard } from "../components/ConsistencyCard"
import { DashboardHeader } from "../components/DashboardHeader"
import { DashboardLoading } from "../components/DashboardLoading"
import { PinnedCoursesCard } from "../components/PinnedCoursesCard"
import { RecentActivityCard } from "../components/RecentActivityCard"
import { ReviewQueueCard } from "../components/ReviewQueueCard"
import { useDashboardData } from "../hooks/use-dashboard-data"

/** Daily launchpad, backed entirely by the Library repository queries. */
export function DashboardPage(): ReactNode {
  const navigate = useNavigate()
  const dashboard = useDashboardData()
  const createPage = useCreatePage()
  const createSet = useCreateCardSet()
  const [actionError, setActionError] = useState<string | null>(null)

  if (dashboard.isError) return <LibraryErrorState onRetry={dashboard.refetch} />
  if (dashboard.isPending || !dashboard.data || !dashboard.folders) return <DashboardLoading />

  const quickNote = () => {
    setActionError(null)
    createPage.mutate(
      { folderId: null },
      {
        onSuccess: (page) => navigate(libraryPaths.note(page.id)),
        onError: (error) => setActionError(getErrorMessage(error)),
      }
    )
  }

  const quickSet = () => {
    setActionError(null)
    createSet.mutate(
      { folderId: null, title: "Untitled card set" },
      {
        onSuccess: (set) => navigate(libraryPaths.cardSet(set.id)),
        onError: (error) => setActionError(getErrorMessage(error)),
      }
    )
  }

  const isCreating = createPage.isPending || createSet.isPending

  return (
    <PageContainer className="gap-4 md:gap-5">
      <DashboardHeader onQuickNote={quickNote} onQuickSet={quickSet} isCreating={isCreating} />
      {actionError && <LibraryActionError message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ReviewQueueCard
            dueCount={dashboard.data.dueCount}
            groups={dashboard.data.dueGroups}
            onStart={() => navigate("/dashboard/review?mode=due")}
          />
          <RecentActivityCard items={dashboard.data.recent} folders={dashboard.folders} />
        </div>

        <aside aria-label="Study overview" className="flex min-w-0 flex-col gap-4">
          <PinnedCoursesCard courses={dashboard.data.pinned} />
          <ConsistencyCard activity={dashboard.data.activity} mastery={dashboard.data.mastery} />
        </aside>
      </div>
    </PageContainer>
  )
}
