import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'
import { ProfileView } from '@/components/profile/profile-view'

export const Route = createFileRoute('/profile')({
  component: ProfilePage
})

function ProfilePage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  )
}
