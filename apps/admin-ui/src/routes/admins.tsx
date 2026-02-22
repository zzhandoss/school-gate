import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'

export const Route = createFileRoute('/admins')({
  component: AdminsLayout
})

function AdminsLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
