import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'

export const Route = createFileRoute('/devices')({
  component: DevicesLayout
})

function DevicesLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
