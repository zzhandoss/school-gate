import type { AccessEventStatus, ListAccessEventsInput } from "@/lib/access-events/types"

export type AccessEventsFilterDraft = {
  status: "all" | AccessEventStatus
  direction: "all" | "IN" | "OUT"
  deviceId: string
  iin: string
  terminalPersonId: string
  from: string
  to: string
}

export type AccessEventsSearchState = {
  limit: number
  offset: number
  status: "all" | AccessEventStatus
  direction: "all" | "IN" | "OUT"
  deviceId: string
  iin: string
  terminalPersonId: string
  from: string
  to: string
}

export const DEFAULT_FILTERS: AccessEventsFilterDraft = {
  status: "all",
  direction: "all",
  deviceId: "",
  iin: "",
  terminalPersonId: "",
  from: "",
  to: ""
}

export function fromSearchToDraft(search: AccessEventsSearchState): AccessEventsFilterDraft {
  return {
    status: search.status,
    direction: search.direction,
    deviceId: search.deviceId,
    iin: search.iin,
    terminalPersonId: search.terminalPersonId,
    from: search.from,
    to: search.to
  }
}

export function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return parsed.toISOString()
}

export function toListAccessEventsInput(search: AccessEventsSearchState): ListAccessEventsInput {
  const from = toIsoDateTime(search.from)
  const to = toIsoDateTime(search.to)

  return {
    limit: search.limit,
    offset: search.offset,
    ...(search.status !== "all" ? { status: search.status } : {}),
    ...(search.direction !== "all" ? { direction: search.direction } : {}),
    ...(search.deviceId ? { deviceId: search.deviceId } : {}),
    ...(search.iin ? { iin: search.iin } : {}),
    ...(search.terminalPersonId ? { terminalPersonId: search.terminalPersonId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {})
  }
}

export function countAppliedFilters(filters: AccessEventsFilterDraft, limit: number) {
  let total = 0
  if (filters.status !== "all") total += 1
  if (filters.direction !== "all") total += 1
  if (filters.deviceId.trim()) total += 1
  if (filters.iin.trim()) total += 1
  if (filters.terminalPersonId.trim()) total += 1
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
  const items: Array<number | "ellipsis"> = []

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push("ellipsis")
    }
    items.push(page)
  }

  return items
}
