import { createFileRoute } from '@tanstack/react-router'

import { AlertsView } from '@/components/alerts/alerts-view'
import { AppShell } from '@/components/app/app-shell'

type AlertsSearch = {
  eventsLimit?: number
  eventsOffset?: number
}

const EVENTS_LIMIT_OPTIONS = new Set([10, 20, 50])

export const Route = createFileRoute('/alerts')({
  validateSearch: (search: AlertsSearch) => {
    const eventsLimit = Number(search.eventsLimit)
    const eventsOffset = Number(search.eventsOffset)

    return {
      eventsLimit: Number.isInteger(eventsLimit) && EVENTS_LIMIT_OPTIONS.has(eventsLimit) ? eventsLimit : 10,
      eventsOffset: Number.isInteger(eventsOffset) && eventsOffset >= 0 ? eventsOffset : 0
    } as const
  },
  component: AlertsPage
})

function AlertsPage() {
  return (
    <AppShell>
      <AlertsView />
    </AppShell>
  )
}
