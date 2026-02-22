import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'

import { AuditLogsFilters } from './audit-logs-filters'
import { AuditLogsTable } from './audit-logs-table'
import {
  DEFAULT_FILTERS,
  buildPaginationItems,
  countAppliedFilters,
  fromSearchToDraft,
  toListAuditLogsInput
} from './audit-logs-view.helpers'
import type { AuditLogsFilterDraft } from './audit-logs-view.helpers'
import type { AuditLogItem, ListAuditLogsResult } from '@/lib/audit-logs/types'
import { Route } from '@/routes/audit-logs'
import { listAuditLogs } from '@/lib/audit-logs/service'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

type AuditLogsViewProps = {
  initialData: ListAuditLogsResult | null
}

export function AuditLogsView({ initialData }: AuditLogsViewProps) {
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('monitoring.read') ?? false

  const [logs, setLogs] = useState<Array<AuditLogItem>>(initialData?.logs ?? [])
  const [total, setTotal] = useState(initialData?.page.total ?? 0)
  const [tableLoading, setTableLoading] = useState(!initialData)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AuditLogsFilterDraft>(DEFAULT_FILTERS)
  const [draftLimit, setDraftLimit] = useState(search.limit)

  const firstLoadSkippedRef = useRef(Boolean(initialData))
  const tableSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDraftFilters(fromSearchToDraft(search))
    setDraftLimit(search.limit)
  }, [search])

  useEffect(() => {
    if (!initialData) {
      return
    }
    setLogs(initialData.logs)
    setTotal(initialData.page.total)
  }, [initialData])

  const rangeStart = total === 0 ? 0 : search.offset + 1
  const rangeEnd = total === 0 ? 0 : Math.min(search.offset + logs.length, total)
  const appliedFiltersCount = useMemo(
    () => countAppliedFilters(draftFilters, search.limit),
    [draftFilters, search.limit]
  )
  const currentPage = Math.floor(search.offset / search.limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / search.limit))
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const scrollToTable = useCallback(() => {
    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const load = useCallback(async () => {
    setError(null)
    setTableLoading(true)
    try {
      const response = await listAuditLogs(toListAuditLogsInput(search))
      setLogs(response.logs)
      setTotal(response.page.total)
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : 'Failed to load audit logs')
    } finally {
      setTableLoading(false)
    }
  }, [router, search])

  useEffect(() => {
    if (!canRead) {
      setTableLoading(false)
      return
    }

    if (firstLoadSkippedRef.current) {
      firstLoadSkippedRef.current = false
      setTableLoading(false)
      return
    }

    void load()
  }, [canRead, load])

  const onApplyFilters = useCallback(async () => {
    await navigate({
      search: {
        ...search,
        limit: draftLimit,
        offset: 0,
        actorId: draftFilters.actorId.trim(),
        action: draftFilters.action.trim(),
        entityType: draftFilters.entityType.trim(),
        entityId: draftFilters.entityId.trim(),
        from: draftFilters.from.trim(),
        to: draftFilters.to.trim()
      }
    })

    setFiltersOpen(false)
    scrollToTable()
  }, [draftFilters, draftLimit, navigate, scrollToTable, search])

  const onResetFilters = useCallback(async () => {
    await navigate({
      search: {
        limit: 20,
        offset: 0,
        actorId: '',
        action: '',
        entityType: '',
        entityId: '',
        from: '',
        to: ''
      }
    })
    scrollToTable()
  }, [navigate, scrollToTable])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const goToPage = useCallback(async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return
    }

    await navigate({
      search: {
        ...search,
        offset: (nextPage - 1) * search.limit
      }
    })

    scrollToTable()
  }, [currentPage, navigate, scrollToTable, search, totalPages])

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>Your account does not have `monitoring.read` permission.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Audit logs</h1>
          <p className="text-sm text-muted-foreground">
            Operational history with URL-persisted filters and server pagination.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={refreshing || tableLoading} onClick={() => void onRefresh()}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <AuditLogsFilters
        filtersOpen={filtersOpen}
        appliedFiltersCount={appliedFiltersCount}
        draftFilters={draftFilters}
        draftLimit={draftLimit}
        onFiltersOpenChange={setFiltersOpen}
        onDraftFiltersChange={(updater) => setDraftFilters((prev) => updater(prev))}
        onDraftLimitChange={setDraftLimit}
        onApplyFilters={(event) => {
          event.preventDefault()
          return onApplyFilters()
        }}
        onResetFilters={onResetFilters}
      />

      <div id="audit-logs-table" ref={tableSectionRef}>
        <Card>
          <CardHeader>
            <CardTitle>History stream</CardTitle>
            <CardDescription>
              {rangeStart}-{rangeEnd} of {total} logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>Audit logs failed to load</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <AuditLogsTable logs={logs} loading={tableLoading} />

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious disabled={!canGoPrev || tableLoading} onClick={() => void goToPage(currentPage - 1)} />
                </PaginationItem>
                {paginationItems.map((item, index) => (
                  <PaginationItem key={`${String(item)}-${index}`}>
                    {item === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#audit-logs-table"
                        isActive={item === currentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          void goToPage(item)
                        }}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext disabled={!canGoNext || tableLoading} onClick={() => void goToPage(currentPage + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
