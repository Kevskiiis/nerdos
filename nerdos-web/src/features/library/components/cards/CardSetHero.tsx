import type { ReactNode } from "react"
import { Layers, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MasteryBreakdown } from "../../lib/card-status"
import { displayTitle } from "../../lib/format"
import type { NotecardSet } from "../../types"
import { MasteryBar } from "./MasteryBar"

interface CardSetHeroProps {
  cardSet: NotecardSet
  breakdown: MasteryBreakdown
  cardCount: number
  dueCount: number
  onStudyDue: () => void
  onCram: () => void
}

/** Title, mastery summary and the two ways to start studying. */
export function CardSetHero({ cardSet, breakdown, cardCount, dueCount, onStudyDue, onCram }: CardSetHeroProps): ReactNode {
  return (
    <section aria-label="Set overview" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight break-words">{displayTitle(cardSet.title)}</h2>
        {cardSet.description && <p className="text-sm text-muted-foreground">{cardSet.description}</p>}
      </div>

      <MasteryBar breakdown={breakdown} />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button className="min-h-11" disabled={dueCount === 0} onClick={onStudyDue}>
          <Play />
          {dueCount === 0 ? "All caught up!" : `Study Due (${dueCount})`}
        </Button>
        <Button variant="outline" className="min-h-11" disabled={cardCount === 0} onClick={onCram}>
          <Layers />
          Cram All ({cardCount})
        </Button>
      </div>
    </section>
  )
}
