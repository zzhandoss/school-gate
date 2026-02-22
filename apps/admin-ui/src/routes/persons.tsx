import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'

export const Route = createFileRoute('/persons')({
  component: PersonsLayout
})

function PersonsLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
