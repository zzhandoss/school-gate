import type { ListAuditLogsInput, ListAuditLogsResult } from './types'
import { requestApi } from '@/lib/api/client'

export async function listAuditLogs(input: ListAuditLogsInput): Promise<ListAuditLogsResult> {
  const query = new URLSearchParams({
    limit: String(input.limit),
    offset: String(input.offset)
  })

  if (input.actorId) query.set('actorId', input.actorId)
  if (input.action) query.set('action', input.action)
  if (input.entityType) query.set('entityType', input.entityType)
  if (input.entityId) query.set('entityId', input.entityId)
  if (input.from) query.set('from', input.from)
  if (input.to) query.set('to', input.to)

  return requestApi<ListAuditLogsResult>(`/api/audit-logs?${query.toString()}`)
}
