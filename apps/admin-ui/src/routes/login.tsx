import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SessionState } from '@/lib/auth/types'
import { LoginCard } from '@/components/auth/login-card'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    const routeContext = context as { session?: SessionState | null }
    if (routeContext.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#ffe8bf,transparent_45%),radial-gradient(circle_at_bottom_left,#d5f2ec,transparent_45%),#f8fafc] px-6 py-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginCard />
      </div>
    </div>
  )
}
