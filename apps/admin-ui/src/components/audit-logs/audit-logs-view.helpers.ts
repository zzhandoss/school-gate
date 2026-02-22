import type { ListAuditLogsInput } from '@/lib/audit-logs/types'

export type AuditLogsFilterDraft = {
  actorId: string
  action: string
  entityType: string
  entityId: string
  from: string
  to: string
}

export type AuditLogsSearchState = {
  limit: number
  offset: number
  actorId: string
  action: string
  entityType: string
  entityId: string
  from: string
  to: string
}

export const DEFAULT_FILTERS: AuditLogsFilterDraft = {
  actorId: '',
  action: '',
  entityType: '',
  entityId: '',
  from: '',
  to: ''
}

export function fromSearchToDraft(search: AuditLogsSearchState): AuditLogsFilterDraft {
  return {
    actorId: search.actorId,
    action: search.action,
    entityType: search.entityType,
    entityId: search.entityId,
    from: search.from,
    to: search.to
  }
}

function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

export function toListAuditLogsInput(search: AuditLogsSearchState): ListAuditLogsInput {
  const from = toIsoDateTime(search.from)
  const to = toIsoDateTime(search.to)

  return {
    limit: search.limit,
    offset: search.offset,
    ...(search.actorId ? { actorId: search.actorId } : {}),
    ...(search.action ? { action: search.action } : {}),
    ...(search.entityType ? { entityType: search.entityType } : {}),
    ...(search.entityId ? { entityId: search.entityId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {})
  }
}

export function countAppliedFilters(filters: AuditLogsFilterDraft, limit: number) {
  let total = 0
  if (filters.actorId.trim()) total += 1
  if (filters.action.trim()) total += 1
  if (filters.entityType.trim()) total += 1
  if (filters.entityId.trim()) total += 1
  if (filters.from.trim()) total += 1
  if (filters.to.trim()) total += 1
  if (limit !== 20) total += 1
  return total
}

export function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  pages.add(currentPage)
  pages.add(currentPage - 1)
  pages.add(currentPage + 1)

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: Array<number | 'ellipsis'> = []
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push('ellipsis')
    }
    items.push(page)
  }

  return items
}
