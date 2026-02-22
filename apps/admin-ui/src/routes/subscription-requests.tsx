import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app/app-shell'
import { SubscriptionRequestsView } from '@/components/subscription-requests/subscription-requests-view'

type SubscriptionRequestsSearch = {
  limit?: number
  offset?: number
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'not_pending'
  only?: 'all' | 'new' | 'ready_for_review' | 'needs_person'
  order?: 'oldest' | 'newest'
}

const LIMIT_OPTIONS = new Set([20, 50, 100])
const STATUS_OPTIONS = new Set(['all', 'pending', 'approved', 'rejected', 'not_pending'])
const ONLY_OPTIONS = new Set(['all', 'new', 'ready_for_review', 'needs_person'])
const ORDER_OPTIONS = new Set(['oldest', 'newest'])

export const Route = createFileRoute('/subscription-requests')({
  validateSearch: (search: SubscriptionRequestsSearch) => {
    const limit = Number(search.limit)
    const offset = Number(search.offset)
    const status =
      typeof search.status === 'string' && STATUS_OPTIONS.has(search.status)
        ? search.status
        : 'pending'
    const only =
      typeof search.only === 'string' && ONLY_OPTIONS.has(search.only) ? search.only : 'all'
    const order =
      typeof search.order === 'string' && ORDER_OPTIONS.has(search.order)
        ? search.order
        : 'newest'

    return {
      limit: Number.isInteger(limit) && LIMIT_OPTIONS.has(limit) ? limit : 20,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      status,
      only,
      order
    } as const
  },
  component: SubscriptionRequestsPage
})

function SubscriptionRequestsPage() {
  return (
    <AppShell>
      <SubscriptionRequestsView />
    </AppShell>
  )
}
