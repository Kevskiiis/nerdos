import type { ReactNode } from "react"
import { ArrowRight, CheckCircle2, Library, Play } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { libraryPaths } from "@/features/library/routes"
import type { DueSetGroup } from "../lib/aggregate"

interface ReviewQueueCardProps {
  dueCount: number
  groups: readonly DueSetGroup[]
  onStart: () => void
}

export function ReviewQueueCard({ dueCount, groups, onStart }: ReviewQueueCardProps): ReactNode {
  if (dueCount === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="size-9 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-base font-semibold">All caught up for today</h3>
            <p className="mt-1 text-sm text-muted-foreground">Nothing is due. A quick cram or a new note is always here.</p>
          </div>
          <Link to={libraryPaths.root} className={cn(buttonVariants({ variant: "outline" }), "min-h-11 sm:min-h-9")}>
            Browse your library
            <ArrowRight />
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Today’s review queue</CardTitle>
        <CardDescription>
          {dueCount} {dueCount === 1 ? "card" : "cards"} due across {groups.length} {groups.length === 1 ? "set" : "sets"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button className="min-h-11 w-full sm:w-fit" onClick={onStart}>
          <Play />
          Start Daily Review
        </Button>
        <div className="flex flex-wrap gap-2" aria-label="Due cards by set">
          {groups.map(({ set, label, dueCount: setDue }) => (
            <Link key={set.id} to={libraryPaths.study(set.id)} aria-label={`${set.title}, ${setDue} due`}>
              <Badge variant="secondary" className="min-h-8 gap-1.5 px-2.5 text-xs">
                <Library className="size-3" aria-hidden="true" />
                <span className="max-w-44 truncate">{label}</span>
                <span className="font-semibold tabular-nums">{setDue}</span>
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
