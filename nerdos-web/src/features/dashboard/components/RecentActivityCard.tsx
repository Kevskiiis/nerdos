import type { ReactNode } from "react"
import { FileText, Folder, Layers3 } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatFolderPath, indexFolders } from "@/features/library/lib/folder-tree"
import { displayTitle, formatRelativeTime } from "@/features/library/lib/format"
import { libraryPaths } from "@/features/library/routes"
import type { Folder as StudyFolder, LibraryItem } from "@/features/library/types"

interface RecentActivityCardProps {
  items: readonly LibraryItem[]
  folders: readonly StudyFolder[]
}

export function RecentActivityCard({ items, folders }: RecentActivityCardProps): ReactNode {
  const index = indexFolders(folders)

  return (
    <Card className="border border-border shadow-none">
      <CardHeader>
        <CardTitle>Continue where you left off</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Your notes and card sets will appear here after you create them.</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((entry) => {
              const isPage = entry.kind === "page"
              const title = displayTitle(entry.item.title)
              const folderLabel = entry.item.folderId ? formatFolderPath(entry.item.folderId, index) : "Unfiled"
              const href = isPage ? libraryPaths.note(entry.item.id) : libraryPaths.cardSet(entry.item.id)
              const Icon = isPage ? FileText : Layers3

              return (
                <li key={`${entry.kind}-${entry.item.id}`} className="border-b border-border last:border-b-0">
                  <Link
                    to={href}
                    className="flex min-h-20 min-w-0 items-start gap-3 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{title}</span>
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="min-w-0 max-w-full font-normal">
                          <Folder aria-hidden="true" />
                          <span className="truncate">{folderLabel}</span>
                        </Badge>
                        <span className="shrink-0">Edited {formatRelativeTime(entry.item.updatedAt)}</span>
                      </span>
                      {isPage ? (
                        <span className="line-clamp-2 text-xs text-muted-foreground">{entry.item.excerpt || "No content yet"}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {entry.item.cardCount} cards · {entry.item.dueCount} due
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
