import { useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { LibraryErrorState, LibraryLoadingState } from "@/features/library/components/LibraryFeedback"
import { StudySession } from "@/features/library/components/study/StudySession"
import { useAllCards } from "@/features/library/hooks/use-library-queries"
import { useStudyOptions } from "@/features/library/hooks/use-study-options"
import type { StudyKind } from "@/features/library/lib/study-session"

function parseMode(value: string | null): StudyKind {
  return value === "cram" ? "cram" : "due"
}

/** Library-wide daily review. Cards are interleaved by the shared FSRS study queue. */
export function DailyReviewPage(): ReactNode {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const cardsQuery = useAllCards()
  const [options, setOptions] = useStudyOptions()
  const [sessionId, setSessionId] = useState(0)
  const mode = parseMode(searchParams.get("mode"))

  if (cardsQuery.isError) return <LibraryErrorState onRetry={() => void cardsQuery.refetch()} />
  if (cardsQuery.isPending || !cardsQuery.data) return <LibraryLoadingState />

  const startCram = () => {
    setSessionId((id) => id + 1)
    setSearchParams({ mode: "cram" })
  }

  return (
    <StudySession
      key={`${mode}-${sessionId}`}
      setId={null}
      cards={cardsQuery.data}
      kind={mode}
      options={options}
      onOptionsChange={setOptions}
      onExit={() => navigate("/dashboard", { replace: true })}
      onCram={startCram}
    />
  )
}
