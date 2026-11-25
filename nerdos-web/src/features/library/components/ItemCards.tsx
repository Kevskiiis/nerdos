import type { ReactNode } from "react"
import { FileText, Folder as FolderIcon, Layers } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ItemAction } from "../hooks/use-library-actions"
import type { LibraryViewMode } from "../hooks/use-library-view-mode"
import { pluralize } from "../lib/browse"
import { displayTitle, formatRelativeTime } from "../lib/format"
import { libraryPaths } from "../routes"
import type { LibraryItem, NotecardSet, PageSummary } from "../types"
import { ItemMenu } from "./LibraryMenus"

const CARD_CLASS =
  "relative flex rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors focus-within:ring-2 focus-within:ring-ring/40 hover:bg-muted/50"
const LINK_CLASS = "min-w-0 outline-none after:absolute after:inset-0 after:rounded-xl"

interface ItemCardProps<T> {
  item: T
  layout: LibraryViewMode
  /** Set only while searching across the whole library. */
  folderLabel?: string
  onAction: (entry: LibraryItem, action: ItemAction) => void
}

function FolderBadge({ label }: { label: string }): ReactNode {
  return (
    <Badge variant="outline" className="min-w-0 max-w-full">
      <FolderIcon aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Badge>
  )
}

export function PageCard({ item: page, layout, folderLabel, onAction }: ItemCardProps<PageSummary>): ReactNode {
  const title = displayTitle(page.title)
  const isList = layout === "list"

  return (
    <article className={cn(CARD_CLASS, isList ? "min-h-16 items-center gap-3 py-2" : "min-h-32 flex-col gap-2")}>
      <div className={cn("flex min-w-0 items-start gap-2", isList ? "flex-1 items-center" : "justify-between")}>
        <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm leading-snug font-semibold">
            <Link to={libraryPaths.note(page.id)} className={cn(LINK_CLASS, "block truncate")}>
              {title}
            </Link>
          </h3>
          {isList && <p className="truncate text-xs text-muted-foreground">{page.excerpt || "No content yet"}</p>}
        </div>
        {!isList && (
          <ItemMenu entry={{ kind: "page", item: page }} onAction={onAction} className="-mt-2 -mr-2 md:-mt-1 md:-mr-1" />
        )}
      </div>
      {!isList && <p className="line-clamp-2 text-sm text-muted-foreground">{page.excerpt || "No content yet"}</p>}
      <div className="mt-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">{formatRelativeTime(page.updatedAt)}</span>
        {folderLabel && <FolderBadge label={folderLabel} />}
      </div>
      {isList && <ItemMenu entry={{ kind: "page", item: page }} onAction={onAction} className="-my-2 -mr-2" />}
    </article>
  )
}

export function CardSetCard({ item: set, layout, folderLabel, onAction }: ItemCardProps<NotecardSet>): ReactNode {
  const title = displayTitle(set.title)
  const isList = layout === "list"
  const entry: LibraryItem = { kind: "cardSet", item: set }

  const stats = (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Badge variant="secondary">
        {pluralize(set.cardCount, "card")}
      </Badge>
      <Badge variant={set.dueCount > 0 ? "default" : "outline"}>{set.dueCount} due</Badge>
      {folderLabel && <FolderBadge label={folderLabel} />}
    </div>
  )

  const study = (
    <Link
      to={set.dueCount > 0 ? libraryPaths.study(set.id) : libraryPaths.cardSet(set.id)}
      aria-label={`Study ${title}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative z-10 min-h-11 shrink-0 md:min-h-8")}
    >
      Study
    </Link>
  )

  return (
    <article className={cn(CARD_CLASS, isList ? "min-h-16 items-center gap-3 py-2" : "min-h-32 flex-col gap-2")}>
      <div className={cn("flex min-w-0 items-start gap-2", isList ? "flex-1 items-center" : "justify-between")}>
        <Layers className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm leading-snug font-semibold">
            <Link to={libraryPaths.cardSet(set.id)} className={cn(LINK_CLASS, "block truncate")}>
              {title}
            </Link>
          </h3>
          {isList && stats}
        </div>
        {!isList && <ItemMenu entry={entry} onAction={onAction} className="-mt-2 -mr-2 md:-mt-1 md:-mr-1" />}
      </div>
      {!isList && (
        <>
          <p className="line-clamp-1 text-sm text-muted-foreground">{set.description || "No description"}</p>
          {stats}
        </>
      )}
      {isList ? (
        <>
          {study}
          <ItemMenu entry={entry} onAction={onAction} className="-my-2 -mr-2" />
        </>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatRelativeTime(set.updatedAt)}</span>
          {study}
        </div>
      )}
    </article>
  )
}
