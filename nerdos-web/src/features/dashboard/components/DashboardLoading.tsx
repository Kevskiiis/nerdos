import type { ReactNode } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoading(): ReactNode {
  return (
    <PageContainer className="gap-4" aria-busy="true">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-72" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </PageContainer>
  )
}
