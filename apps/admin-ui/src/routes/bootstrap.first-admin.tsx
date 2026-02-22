import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SessionState } from '@/lib/auth/types'
import { FirstAdminCard } from '@/components/auth/first-admin-card'

export const Route = createFileRoute('/bootstrap/first-admin')({
  beforeLoad: ({ context }) => {
    const routeContext = context as { session?: SessionState | null }
    if (routeContext.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: BootstrapFirstAdminPage
})

function BootstrapFirstAdminPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#d8f0eb,transparent_45%),radial-gradient(circle_at_bottom_left,#ffe8bf,transparent_45%),#f8fafc] px-6 py-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <FirstAdminCard />
      </div>
    </div>
  )
}
