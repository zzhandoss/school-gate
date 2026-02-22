import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SessionState } from '@/lib/auth/types'
import { PasswordResetRequestCard } from '@/components/auth/password-reset-request-card'

export const Route = createFileRoute('/password-reset/request')({
  beforeLoad: ({ context }) => {
    const routeContext = context as { session?: SessionState | null }
    if (routeContext.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: PasswordResetRequestPage
})

function PasswordResetRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#d8f0eb,transparent_45%),radial-gradient(circle_at_bottom_left,#e6ddff,transparent_45%),#f8fafc] px-6 py-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <PasswordResetRequestCard />
      </div>
    </div>
  )
}
