import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'
import { SettingsView } from '@/components/settings/settings-view'

export const Route = createFileRoute('/settings')({
  component: SettingsPage
})

function SettingsPage() {
  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  )
}
