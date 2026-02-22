import { createFileRoute, redirect } from '@tanstack/react-router'

import { AccessEventsView } from '@/components/access-events/access-events-view'
import { AppShell } from '@/components/app/app-shell'
import { getInitialAccessEventsServerFn } from '@/lib/access-events/access-events.server'
import { ApiError } from '@/lib/api/types'

type AccessEventsSearch = {
  limit?: number
  offset?: number
  status?: 'all' | 'NEW' | 'PROCESSING' | 'PROCESSED' | 'FAILED_RETRY' | 'UNMATCHED' | 'ERROR'
  direction?: 'all' | 'IN' | 'OUT'
  deviceId?: string
  iin?: string
  terminalPersonId?: string
  from?: string
  to?: string
}

const LIMIT_OPTIONS = new Set([20, 50, 100])
const STATUS_OPTIONS = new Set(['all', 'NEW', 'PROCESSING', 'PROCESSED', 'FAILED_RETRY', 'UNMATCHED', 'ERROR'])
const DIRECTION_OPTIONS = new Set(['all', 'IN', 'OUT'])

function normalizeDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? '' : trimmed
}

export const Route = createFileRoute('/access-events')({
  validateSearch: (search: AccessEventsSearch) => {
    const limit = Number(search.limit)
    const offset = Number(search.offset)
    const status =
      typeof search.status === 'string' && STATUS_OPTIONS.has(search.status)
        ? search.status
        : 'all'
    const direction =
      typeof search.direction === 'string' && DIRECTION_OPTIONS.has(search.direction)
        ? search.direction
        : 'all'

    return {
      limit: Number.isInteger(limit) && LIMIT_OPTIONS.has(limit) ? limit : 20,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      status,
      direction,
      deviceId: typeof search.deviceId === 'string' ? search.deviceId.trim() : '',
      iin: typeof search.iin === 'string' ? search.iin.trim() : '',
      terminalPersonId:
        typeof search.terminalPersonId === 'string' ? search.terminalPersonId.trim() : '',
      from: normalizeDateTime(search.from),
      to: normalizeDateTime(search.to)
    } as const
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const initialData = await getInitialAccessEventsServerFn({ data: deps })
      return { initialData }
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        throw redirect({ to: '/unavailable' })
      }
      return { initialData: null }
    }
  },
  component: AccessEventsPage
})

function AccessEventsPage() {
  const { initialData } = Route.useLoaderData()

  return (
    <AppShell>
      <AccessEventsView initialData={initialData} />
    </AppShell>
  )
}
