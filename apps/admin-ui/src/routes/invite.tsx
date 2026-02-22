import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SessionState } from '@/lib/auth/types'
import { InviteCard } from '@/components/auth/invite-card'

type InviteSearch = {
  token?: string
}

export const Route = createFileRoute('/invite')({
  validateSearch: (search: InviteSearch) => ({
    token: typeof search.token === 'string' ? search.token : undefined
  }),
  beforeLoad: ({ context }) => {
    const routeContext = context as { session?: SessionState | null }
    if (routeContext.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: InvitePage
})

function InvitePage() {
  const search = Route.useSearch()
  const token = search.token?.trim() || null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#d8f0eb,transparent_45%),radial-gradient(circle_at_bottom_left,#ffe8bf,transparent_45%),#f8fafc] px-6 py-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <InviteCard token={token} />
      </div>
    </div>
  )
}
