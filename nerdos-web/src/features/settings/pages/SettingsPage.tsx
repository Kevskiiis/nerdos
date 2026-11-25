import type { ReactNode } from "react"
import { PageContainer } from "@/components/layout/PageContainer"

/**
 * Settings page - empty state ready for user preferences and configuration.
 * Mobile-first responsive container.
 */
export function SettingsPage(): ReactNode {
  return (
    <PageContainer className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Empty state placeholder for settings sections */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Settings options coming soon...</p>
      </div>
    </PageContainer>
  )
}
