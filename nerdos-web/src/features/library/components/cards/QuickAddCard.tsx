import { useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateCard } from "../../hooks/use-library-mutations"
import { getErrorMessage } from "../../lib/errors"

/** Add-card composer: Front, Tab, Back, then Ctrl/Cmd + Enter. Focus returns to Front for rapid entry. */
export function QuickAddCard({ setId }: { setId: string }): ReactNode {
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [error, setError] = useState<string | null>(null)
  const frontRef = useRef<HTMLInputElement>(null)
  const { mutate } = useCreateCard()

  const canAdd = front.trim().length > 0 && back.trim().length > 0

  const submit = () => {
    if (!canAdd) return
    const input = { setId, front, back }
    // Clear first so the next card can be typed immediately; restore it if the save fails.
    setFront("")
    setBack("")
    setError(null)
    frontRef.current?.focus()
    mutate(input, {
      onError: (caught) => {
        setError(getErrorMessage(caught))
        setFront((current) => current || input.front)
        setBack((current) => current || input.back)
      },
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section aria-label="Add a card" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground sm:p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input
          ref={frontRef}
          value={front}
          onChange={(event) => setFront(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Front"
          aria-label="Card front"
          maxLength={2000}
          className="h-11 min-h-11 md:h-9 md:min-h-9"
        />
        <Textarea
          value={back}
          onChange={(event) => setBack(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Back"
          aria-label="Card back"
          rows={1}
          maxLength={2000}
          className="h-11 min-h-11 field-sizing-fixed resize-none overflow-hidden py-2 md:h-9 md:min-h-9"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="hidden text-xs text-muted-foreground sm:block">Tab to switch · Ctrl/⌘ + Enter to add</p>
        <Button className="min-h-11 w-full sm:ml-auto sm:min-h-9 sm:w-auto" disabled={!canAdd} onClick={submit}>
          <Plus />
          Add
        </Button>
      </div>
    </section>
  )
}
