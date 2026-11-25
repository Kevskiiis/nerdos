import { useState, type ReactNode } from "react"
import { Layers, Pencil, SearchX, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeleteCard } from "../../hooks/use-library-mutations"
import { getCardStatus, matchesCardQuery } from "../../lib/card-status"
import type { Notecard } from "../../types"
import { ConfirmDeleteDialog } from "../dialogs/ConfirmDeleteDialog"
import { LibrarySearchInput } from "../LibraryControls"
import { LibraryEmptyState } from "../LibraryFeedback"
import { CardEditDialog } from "./CardEditDialog"
import { CardStatusBadge } from "./CardStatusBadge"
import { RichText } from "./RichText"

interface CardListProps {
  setId: string
  cards: readonly Notecard[]
  now: Date
}

const ICON_BUTTON_CLASS = "size-11 shrink-0 md:size-8"

/** Searchable list of a set's cards with inline edit and delete. */
export function CardList({ setId, cards, now }: CardListProps): ReactNode {
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Notecard | null>(null)
  const [deleting, setDeleting] = useState<Notecard | null>(null)
  const { mutateAsync: deleteCard } = useDeleteCard(setId)

  const visible = cards.filter((card) => matchesCardQuery(card, query))

  return (
    <section aria-label="Cards" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Cards ({cards.length})</h3>
        {cards.length > 0 && (
          <LibrarySearchInput value={query} onChange={setQuery} placeholder="Search cards" label="Search cards" />
        )}
      </div>

      {cards.length === 0 ? (
        <LibraryEmptyState icon={Layers} title="No cards yet" description="Add your first card above to start studying." />
      ) : visible.length === 0 ? (
        <LibraryEmptyState icon={SearchX} title="No results" description={`No cards match "${query.trim()}".`} />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((card) => (
            <li
              key={card.id}
              className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 pl-4 text-card-foreground"
            >
              <div className="grid min-w-0 flex-1 gap-1 py-1 sm:grid-cols-2 sm:gap-4">
                <span className="sm:hidden">
                  <CardStatusBadge status={getCardStatus(card.schedule, now)} />
                </span>
                <RichText text={card.front} className="line-clamp-2 text-sm font-medium" />
                <RichText text={card.back} className="line-clamp-2 text-sm text-muted-foreground" />
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <span className="mr-1 hidden sm:inline-flex">
                  <CardStatusBadge status={getCardStatus(card.schedule, now)} />
                </span>
                <Button variant="ghost" size="icon-sm" className={ICON_BUTTON_CLASS} aria-label="Edit card" onClick={() => setEditing(card)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" className={ICON_BUTTON_CLASS} aria-label="Delete card" onClick={() => setDeleting(card)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <CardEditDialog card={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDeleteDialog
          title="Delete this card?"
          description="The card and its review history will be permanently deleted."
          onConfirm={async () => {
            await deleteCard(deleting.id)
            setDeleting(null)
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}
