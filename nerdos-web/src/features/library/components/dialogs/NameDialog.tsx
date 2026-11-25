import { useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "../../lib/errors"

interface NameDialogProps {
  title: string
  description: string
  submitLabel: string
  /** Used as placeholder and accessible label, e.g. "Folder name". */
  fieldLabel: string
  initialName?: string
  onSubmit: (name: string) => Promise<void>
  onClose: () => void
}

/** Name prompt shared by "New folder" and the rename actions. Mounted per open, so its state always starts fresh. */
export function NameDialog({
  title,
  description,
  submitLabel,
  fieldLabel,
  initialName = "",
  onSubmit,
  onClose,
}: NameDialogProps): ReactNode {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(name)
    } catch (caught) {
      setError(getErrorMessage(caught))
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={fieldLabel}
              aria-label={fieldLabel}
              aria-invalid={error ? true : undefined}
              autoFocus
              maxLength={120}
              className="min-h-11 md:min-h-9"
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
            <Button type="submit" className="min-h-11 md:min-h-9" disabled={isSubmitting || !name.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
