import { createFileRoute } from '@tanstack/react-router'

import { AdminRolesView } from '@/components/admins/admin-roles-view'

export const Route = createFileRoute('/admins/roles')({
  component: AdminsRolesPage
})

function AdminsRolesPage() {
  return <AdminRolesView />
}
