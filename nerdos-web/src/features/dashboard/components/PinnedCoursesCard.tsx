import type { ReactNode } from "react"
import { ArrowRight, Folder, Pin } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { libraryPaths } from "@/features/library/routes"
import type { PinnedCourse } from "../lib/aggregate"

export function PinnedCoursesCard({ courses }: { courses: readonly PinnedCourse[] }): ReactNode {
  return (
    <Card className="border border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="size-4" aria-hidden="true" />
          Pinned courses
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {courses.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Pin a course in Library to keep it one tap away.</p>
        ) : (
          <ul className="flex flex-col">
            {courses.map(({ folder, pageCount, setCount }) => (
              <li key={folder.id}>
                <Link
                  to={libraryPaths.folder(folder.id)}
                  className="flex min-h-14 min-w-0 items-center gap-3 rounded-lg px-2 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Folder className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{folder.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {pageCount} {pageCount === 1 ? "page" : "pages"} · {setCount} {setCount === 1 ? "set" : "sets"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to={libraryPaths.root} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary sm:min-h-8">
          View all in Library
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}
