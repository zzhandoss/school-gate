import { createFileRoute } from '@tanstack/react-router'

import { AdminsView } from '@/components/admins/admins-view'

export const Route = createFileRoute('/admins/')({
  component: AdminsPage
})

function AdminsPage() {
  return <AdminsView />
}
