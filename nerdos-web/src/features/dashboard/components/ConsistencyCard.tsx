import type { ReactNode } from "react"
import { Flame, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MasteryBreakdown } from "@/features/library/lib/card-status"
import type { DailyActivity } from "../lib/aggregate"

const DAILY_TARGET = 20

function MasterySegment({ label, count, total, className }: { label: string; count: number; total: number; className: string }): ReactNode {
  return (
    <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${className}`} aria-hidden="true" />
      <span className="font-medium tabular-nums text-foreground">{count}</span>
      <span>{label}</span>
      <span className="sr-only">, {total === 0 ? 0 : Math.round((count / total) * 100)} percent</span>
    </li>
  )
}

export function ConsistencyCard({ activity, mastery }: { activity: DailyActivity; mastery: MasteryBreakdown }): ReactNode {
  const dailyProgress = Math.min(100, Math.round((activity.reviewedToday / DAILY_TARGET) * 100))
  const total = mastery.new + mastery.learning + mastery.mastered

  return (
    <Card className="border border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4" aria-hidden="true" />
          Study consistency
        </CardTitle>
        <CardDescription>{activity.streak === 0 ? "Start a streak today" : `${activity.streak}-day streak`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5">
              <Target className="size-4 text-muted-foreground" aria-hidden="true" />
              Today
            </span>
            <span className="font-medium tabular-nums">
              {activity.reviewedToday} / {DAILY_TARGET}
            </span>
          </div>
          <Progress value={dailyProgress} aria-label="Daily review target" />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Library mastery</p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Library card mastery">
            {total > 0 && (
              <>
                <span className="bg-muted-foreground/40" style={{ width: `${(mastery.new / total) * 100}%` }} />
                <span className="bg-primary/50" style={{ width: `${(mastery.learning / total) * 100}%` }} />
                <span className="bg-primary" style={{ width: `${(mastery.mastered / total) * 100}%` }} />
              </>
            )}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            <MasterySegment label="New" count={mastery.new} total={total} className="bg-muted-foreground/40" />
            <MasterySegment label="Learning" count={mastery.learning} total={total} className="bg-primary/50" />
            <MasterySegment label="Mastered" count={mastery.mastered} total={total} className="bg-primary" />
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
