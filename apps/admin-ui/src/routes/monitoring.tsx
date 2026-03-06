import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'
import { MonitoringView } from '@/components/monitoring/monitoring-view'

export const Route = createFileRoute('/monitoring')({
  component: MonitoringPage
})

function MonitoringPage() {
  return (
    <AppShell>
      <MonitoringView />
    </AppShell>
  )
}
