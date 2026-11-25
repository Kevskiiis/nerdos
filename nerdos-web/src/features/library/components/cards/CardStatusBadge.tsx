import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import type { CardStatus } from "../../lib/card-status"

const STATUS_VIEW: Record<CardStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "New", variant: "outline" },
  due: { label: "Due", variant: "default" },
  learning: { label: "Learning", variant: "secondary" },
  mastered: { label: "Mastered", variant: "secondary" },
}

export function CardStatusBadge({ status }: { status: CardStatus }): ReactNode {
  const { label, variant } = STATUS_VIEW[status]
  return <Badge variant={variant}>{label}</Badge>
}
