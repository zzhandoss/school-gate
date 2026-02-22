import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuditLogsView } from '@/components/audit-logs/audit-logs-view'
import { AppShell } from '@/components/app/app-shell'
import { getInitialAuditLogsServerFn } from '@/lib/audit-logs/audit-logs.server'
import { ApiError } from '@/lib/api/types'

type AuditLogsSearch = {
  limit?: number
  offset?: number
  actorId?: string
  action?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
}

const LIMIT_OPTIONS = new Set([20, 50, 100])

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

export const Route = createFileRoute('/audit-logs')({
  validateSearch: (search: AuditLogsSearch) => {
    const limit = Number(search.limit)
    const offset = Number(search.offset)

    return {
      limit: Number.isInteger(limit) && LIMIT_OPTIONS.has(limit) ? limit : 20,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      actorId: typeof search.actorId === 'string' ? search.actorId.trim() : '',
      action: typeof search.action === 'string' ? search.action.trim() : '',
      entityType: typeof search.entityType === 'string' ? search.entityType.trim() : '',
      entityId: typeof search.entityId === 'string' ? search.entityId.trim() : '',
      from: normalizeDateTime(search.from),
      to: normalizeDateTime(search.to)
    } as const
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const initialData = await getInitialAuditLogsServerFn({ data: deps })
      return { initialData }
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        throw redirect({ to: '/unavailable' })
      }
      return { initialData: null }
    }
  },
  component: AuditLogsPage
})

function AuditLogsPage() {
  const { initialData } = Route.useLoaderData()

  return (
    <AppShell>
      <AuditLogsView initialData={initialData} />
    </AppShell>
  )
}
