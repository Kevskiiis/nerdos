import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { useState } from "react"

interface SupportDialogProps {
  icon?: LucideIcon
  label?: string
  onOpen?: () => void
}

/**
 * Support dialog showing app info and keyboard shortcuts.
 * Renders as a sidebar menu button that opens the dialog.
 * Responsive and touch-friendly for mobile and desktop.
 */
export function SupportDialog({ 
  icon: Icon, 
  label = "Support", 
  onOpen,
}: SupportDialogProps): ReactNode {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && onOpen) {
      onOpen()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <SidebarMenuButton
        onClick={() => setOpen(true)}
        className="min-h-11 cursor-pointer text-muted-foreground hover:text-foreground md:min-h-8"
        tooltip={{ children: label, side: "right" }}
      >
        {Icon && <Icon />}
        <span>{label}</span>
      </SidebarMenuButton>
      <DialogContent className="max-h-dvh w-full max-w-sm overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support & Info</DialogTitle>
          <DialogDescription>
            Learn more about Nerdos and keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <section>
            <h3 className="text-sm font-semibold">About Nerdos</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Nerdos is a student study tool designed to help you organize notes, create flashcards,
              and track your learning progress.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-3">
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-foreground">
                  d
                </code>
                <span>Toggle dark mode</span>
              </li>
              <li className="flex items-start gap-3">
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-foreground">
                  ?
                </code>
                <span>Open this dialog</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Version</h3>
            <p className="mt-2 text-xs text-muted-foreground">v0.0.1</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
