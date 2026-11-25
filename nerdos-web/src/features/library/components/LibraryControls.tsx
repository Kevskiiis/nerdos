import type { ReactNode } from "react"
import { LayoutGrid, List, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { LibraryViewMode } from "../hooks/use-library-view-mode"

export const CONTROL_HEIGHT = "min-h-11 md:min-h-9"

interface LibrarySearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

export function LibrarySearchInput({ value, onChange, placeholder, label }: LibrarySearchInputProps): ReactNode {
  return (
    <div className="relative min-w-0 flex-1 basis-48">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${CONTROL_HEIGHT} pl-9`}
      />
    </div>
  )
}

interface ViewToggleProps {
  view: LibraryViewMode
  onChange: (view: LibraryViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps): ReactNode {
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(values) => {
        const next = values[0]
        if (next === "grid" || next === "list") onChange(next)
      }}
      variant="outline"
      spacing={0}
      aria-label="View mode"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" className={`${CONTROL_HEIGHT} min-w-11 md:min-w-9`}>
        <LayoutGrid />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className={`${CONTROL_HEIGHT} min-w-11 md:min-w-9`}>
        <List />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
