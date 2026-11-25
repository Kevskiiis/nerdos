import type { ReactNode } from "react"
import { FilePlus2, Layers3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" })

interface DashboardHeaderProps {
  onQuickNote: () => void
  onQuickSet: () => void
  isCreating: boolean
}

export function DashboardHeader({ onQuickNote, onQuickSet, isCreating }: DashboardHeaderProps): ReactNode {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">{dateFormatter.format(new Date())}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="outline" className="min-h-11 sm:min-h-9" disabled={isCreating} onClick={onQuickNote}>
          <FilePlus2 />
          Quick Note
        </Button>
        <Button className="min-h-11 sm:min-h-9" disabled={isCreating} onClick={onQuickSet}>
          <Layers3 />
          Quick Set
        </Button>
      </div>
    </header>
  )
}
