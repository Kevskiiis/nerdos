import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { PageContainer } from "@/components/layout/PageContainer"
import { CardList } from "../components/cards/CardList"
import { CardSetHero } from "../components/cards/CardSetHero"
import { CardSetMenu } from "../components/cards/CardSetMenu"
import { QuickAddCard } from "../components/cards/QuickAddCard"
import { LibraryDialogHost } from "../components/dialogs/LibraryDialogHost"
import { LibraryActionError, LibraryErrorState, LibraryLoadingState, LibraryNotFoundState } from "../components/LibraryFeedback"
import { StudySession } from "../components/study/StudySession"
import { ToolHeader } from "../components/ToolHeader"
import { useLibraryActions } from "../hooks/use-library-actions"
import { useCards, useCardSet, useFolders } from "../hooks/use-library-queries"
import { useNow } from "../hooks/use-now"
import { useStudyOptions } from "../hooks/use-study-options"
import { countDue, getMasteryBreakdown } from "../lib/card-status"
import { indexFolders } from "../lib/folder-tree"
import { displayTitle } from "../lib/format"
import type { StudyKind } from "../lib/study-session"
import { libraryPaths } from "../routes"

function parseStudyKind(value: string | null): StudyKind | null {
  return value === "due" || value === "cram" ? value : null
}

/**
 * `/library/cards/:setId` — set overview and card manager. `?study=due|cram` switches the same
 * route into the study stage, so a reload mid-session simply starts a fresh session.
 */
export function CardSetPage(): ReactNode {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const actions = useLibraryActions()
  const tick = useNow()
  const [options, setOptions] = useStudyOptions()
  const [sessionId, setSessionId] = useState(0)

  const setQuery = useCardSet(setId)
  const cardsQuery = useCards(setId)
  const foldersQuery = useFolders()

  // A card created after the last tick is due at creation time, so never let "now" lag behind the data.
  const now = useMemo(() => new Date(Math.max(tick.getTime(), cardsQuery.dataUpdatedAt)), [tick, cardsQuery.dataUpdatedAt])

  const studyKind = parseStudyKind(searchParams.get("study"))

  const startStudy = (kind: StudyKind) => {
    setSessionId((id) => id + 1)
    setSearchParams({ study: kind })
  }
  const exitStudy = () => setSearchParams({}, { replace: true })

  if (setQuery.isError || foldersQuery.isError) {
    return (
      <LibraryErrorState
        onRetry={() => {
          void setQuery.refetch()
          void foldersQuery.refetch()
          void cardsQuery.refetch()
        }}
      />
    )
  }
  if (setQuery.isPending || foldersQuery.isPending) return <LibraryLoadingState />
  const cardSet = setQuery.data
  if (!cardSet) return <LibraryNotFoundState kind="cardSet" />
  if (cardsQuery.isError) return <LibraryErrorState onRetry={() => void cardsQuery.refetch()} />
  if (cardsQuery.isPending) return <LibraryLoadingState />

  const cards = cardsQuery.data
  const folders = foldersQuery.data

  if (studyKind) {
    return (
      <StudySession
        key={`${studyKind}-${sessionId}`}
        setId={cardSet.id}
        cards={cards}
        kind={studyKind}
        options={options}
        onOptionsChange={setOptions}
        onExit={exitStudy}
        onCram={() => startStudy("cram")}
      />
    )
  }

  const folder = cardSet.folderId ? indexFolders(folders).get(cardSet.folderId) : undefined

  return (
    <div className="flex flex-1 flex-col">
      <ToolHeader
        backTo={libraryPaths.directory(cardSet.folderId)}
        backLabel={folder?.name ?? "Library"}
        title={displayTitle(cardSet.title)}
        actions={<CardSetMenu onAction={(action) => actions.onItemAction({ kind: "cardSet", item: cardSet }, action)} />}
      />

      <PageContainer className="mx-auto w-full max-w-3xl gap-5 py-6 md:py-8">
        <CardSetHero
          cardSet={cardSet}
          breakdown={getMasteryBreakdown(cards)}
          cardCount={cards.length}
          dueCount={countDue(cards, now)}
          onStudyDue={() => startStudy("due")}
          onCram={() => startStudy("cram")}
        />
        {actions.actionError && <LibraryActionError message={actions.actionError} onDismiss={actions.dismissError} />}
        <QuickAddCard setId={cardSet.id} />
        <CardList setId={cardSet.id} cards={cards} now={now} />
      </PageContainer>

      <LibraryDialogHost
        dialog={actions.dialog}
        folders={folders}
        onClose={actions.closeDialog}
        onItemDeleted={() => navigate(libraryPaths.directory(cardSet.folderId), { replace: true })}
      />
    </div>
  )
}
