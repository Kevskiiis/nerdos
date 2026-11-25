import type { ReactNode } from "react"
import { Inbox } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ItemAction } from "../hooks/use-library-actions"
import type { LibraryViewMode } from "../hooks/use-library-view-mode"
import type { ItemFilter } from "../lib/browse"
import type { LibraryItem } from "../types"
import { CONTROL_HEIGHT, ViewToggle } from "./LibraryControls"
import { LibraryEmptyState } from "./LibraryFeedback"
import { LibraryItemList } from "./LibraryItemList"

const FILTER_LABELS: Record<ItemFilter, string> = { all: "All", pages: "Pages", cardSets: "Card Sets" }
const FILTERS = Object.keys(FILTER_LABELS) as ItemFilter[]

export function isItemFilter(value: unknown): value is ItemFilter {
  return typeof value === "string" && value in FILTER_LABELS
}

interface ItemFilterToggleProps {
  value: ItemFilter
  onChange: (value: ItemFilter) => void
}

/** Segmented All / Pages / Card Sets control. */
export function ItemFilterToggle({ value, onChange }: ItemFilterToggleProps): ReactNode {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values[0]
        if (isItemFilter(next)) onChange(next)
      }}
      variant="outline"
      spacing={0}
      aria-label="Filter by type"
    >
      {FILTERS.map((filter) => (
        <ToggleGroupItem key={filter} value={filter} className={`${CONTROL_HEIGHT} px-3`}>
          {FILTER_LABELS[filter]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

interface UnfiledSectionProps {
  items: readonly LibraryItem[]
  filter: ItemFilter
  onFilterChange: (filter: ItemFilter) => void
  view: LibraryViewMode
  onViewChange: (view: LibraryViewMode) => void
  onAction: (entry: LibraryItem, action: ItemAction) => void
}

/** Quick items that haven't been filed into a folder yet. */
export function UnfiledSection({
  items,
  filter,
  onFilterChange,
  view,
  onViewChange,
  onAction,
}: UnfiledSectionProps): ReactNode {
  return (
    <section aria-labelledby="unfiled-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="unfiled-heading" className="text-sm font-semibold">
          Unfiled quick items
        </h3>
        <div className="flex items-center gap-2">
          <ItemFilterToggle value={filter} onChange={onFilterChange} />
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>
      {items.length === 0 ? (
        <LibraryEmptyState
          icon={Inbox}
          title="Nothing unfiled"
          description="Quick pages and card sets created here show up until you move them into a folder."
        />
      ) : (
        <LibraryItemList items={items} layout={view} onAction={onAction} />
      )}
    </section>
  )
}
