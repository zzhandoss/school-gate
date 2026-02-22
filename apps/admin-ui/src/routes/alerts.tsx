import { createFileRoute } from '@tanstack/react-router'

import { AlertsView } from '@/components/alerts/alerts-view'
import { AppShell } from '@/components/app/app-shell'

export const Route = createFileRoute('/alerts')({
  component: AlertsPage
})

function AlertsPage() {
  return (
    <AppShell>
      <AlertsView />
    </AppShell>
  )
}
