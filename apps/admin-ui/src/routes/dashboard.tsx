import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage
})

function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  )
}
