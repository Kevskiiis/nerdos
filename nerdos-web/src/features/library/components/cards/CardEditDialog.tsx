import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateCard } from "../../hooks/use-library-mutations"
import { getErrorMessage } from "../../lib/errors"
import type { Notecard } from "../../types"

interface CardEditDialogProps {
  card: Notecard
  onClose: () => void
}

/** Edits both sides of a card. Mounted per open, so it always starts from the card's current text. */
export function CardEditDialog({ card, onClose }: CardEditDialogProps): ReactNode {
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useUpdateCard(card.setId)

  const save = async () => {
    setError(null)
    try {
      await mutateAsync({ id: card.id, patch: { front, back } })
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void save()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void save()
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
            <DialogDescription>Use `backticks` around text to show it as code.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Textarea
              autoFocus
              value={front}
              onChange={(event) => setFront(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Card front"
              placeholder="Front"
              rows={3}
              maxLength={2000}
            />
            <Textarea
              value={back}
              onChange={(event) => setBack(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Card back"
              placeholder="Back"
              rows={3}
              maxLength={2000}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-9" disabled={isPending || !front.trim() || !back.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
