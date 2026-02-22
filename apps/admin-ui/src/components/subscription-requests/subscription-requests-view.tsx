import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SubscriptionRequestsTable } from './subscription-requests-table'
import type {
  SubscriptionRequestItem,
  SubscriptionRequestResolutionStatus,
  SubscriptionRequestStatus
} from '@/lib/subscription-requests/types'
import {
  listSubscriptionRequests,
  resolveSubscriptionRequestPerson,
  reviewSubscriptionRequest
} from '@/lib/subscription-requests/service'
import { Route } from '@/routes/subscription-requests'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import {
  orderLabel,
  subscriptionResolutionLabel,
  subscriptionStatusLabel
} from '@/lib/i18n/enum-labels'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type QueueStatusFilter = 'all' | SubscriptionRequestStatus | 'not_pending'

function buildPaginationItems(currentPage: number, totalPages: number) {
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

export function SubscriptionRequestsView() {
  const { t } = useTranslation()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canRead = permissions.includes('subscriptions.read')
  const canReview = permissions.includes('subscriptions.review')
  const adminTgUserId = session?.admin.tgUserId ?? null

  const [requests, setRequests] = useState<Array<SubscriptionRequestItem>>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<string | null>(null)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolveResult, setResolveResult] = useState<string | null>(null)
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null)

  const [draftStatus, setDraftStatus] = useState<QueueStatusFilter>(search.status)
  const [draftOnly, setDraftOnly] = useState<'all' | SubscriptionRequestResolutionStatus>(search.only)
  const [draftOrder, setDraftOrder] = useState<'oldest' | 'newest'>(search.order)
  const [draftLimit, setDraftLimit] = useState<number>(search.limit)

  useEffect(() => {
    setDraftStatus(search.status)
    setDraftOnly(search.only)
    setDraftOrder(search.order)
    setDraftLimit(search.limit)
  }, [search.limit, search.only, search.order, search.status])

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'pending').length,
    [requests]
  )

  const isPendingIncluded = search.status === 'all' || search.status === 'pending'
  const resolutionFilterEnabled = isPendingIncluded
  const appliedFiltersCount = useMemo(() => {
    let totalFilters = 0
    if (search.status !== 'pending') totalFilters += 1
    if (search.order !== 'newest') totalFilters += 1
    if (isPendingIncluded && search.only !== 'all') totalFilters += 1
    if (search.limit !== 20) totalFilters += 1
    return totalFilters
  }, [isPendingIncluded, search.limit, search.only, search.order, search.status])
  const rangeStart = total === 0 ? 0 : search.offset + 1
  const rangeEnd = total === 0 ? 0 : Math.min(search.offset + requests.length, total)
  const currentPage = Math.floor(search.offset / search.limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / search.limit))
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listSubscriptionRequests({
        limit: search.limit,
        offset: search.offset,
        status: search.status,
        only: resolutionFilterEnabled ? search.only : 'all',
        order: search.order
      })
      setRequests(result.requests)
      setTotal(result.page.total)
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('subscriptionRequests.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }

    void load()
  }, [canRead, search.limit, search.offset, search.only, search.order, search.status, resolutionFilterEnabled])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function onReview(requestId: string, decision: 'approve' | 'reject') {
    if (!adminTgUserId) {
      setReviewError(t('subscriptionRequests.telegramAccountNotLinked'))
      return
    }

    setReviewError(null)
    setResolveError(null)
    setResolveResult(null)
    setReviewResult(null)
    setReviewingRequestId(requestId)
    try {
      const result = await reviewSubscriptionRequest(requestId, {
        decision,
        adminTgUserId
      })
      setReviewResult(t('subscriptionRequests.requestMarkedAs', { requestId: result.requestId, status: subscriptionStatusLabel(t, result.status) }))
      await load()
    } catch (value) {
      setReviewError(value instanceof Error ? value.message : t('subscriptionRequests.reviewFailed'))
    } finally {
      setReviewingRequestId(null)
    }
  }

  async function onResolvePerson(requestId: string, personId: string) {
    setResolveError(null)
    setResolveResult(null)
    setReviewError(null)
    setReviewResult(null)
    setResolvingRequestId(requestId)
    try {
      const result = await resolveSubscriptionRequestPerson(requestId, { personId })
      setResolveResult(t('subscriptionRequests.requestMovedTo', {
        requestId: result.requestId,
        resolutionStatus: subscriptionResolutionLabel(t, result.resolutionStatus),
        personId: result.personId
      }))
      await load()
    } catch (value) {
      setResolveError(value instanceof Error ? value.message : t('subscriptionRequests.resolveFailed'))
    } finally {
      setResolvingRequestId(null)
    }
  }

  async function applyFilters() {
    const normalizedOnly =
      draftStatus === 'all' || draftStatus === 'pending'
        ? draftOnly
        : 'all'

    await navigate({
      search: {
        limit: draftLimit,
        offset: 0,
        status: draftStatus,
        only: normalizedOnly,
        order: draftOrder
      }
    })
  }

  async function resetFilters() {
    await navigate({
      search: {
        limit: 20,
        offset: 0,
        status: 'pending',
        only: 'all',
        order: 'newest'
      }
    })
  }

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return
    }

    await navigate({
      search: (previous) => ({
        ...previous,
        offset: (nextPage - 1) * previous.limit
      })
    })
  }

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>
          {t('subscriptionRequests.accessDeniedDescription')}
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('subscriptionRequests.failedToLoad')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('subscriptionRequests.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subscriptionRequests.subtitle')}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={refreshing || loading} onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('subscriptionRequests.totalFiltered')}</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('subscriptionRequests.pending')}</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('subscriptionRequests.reviewCapability')}</CardDescription>
            <CardTitle className="text-base">
              <Badge variant={canReview ? 'default' : 'outline'}>
                {canReview ? t('dashboard.reviewCapabilityGranted') : t('dashboard.readOnly')}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {t('common.filters.title')}
                {appliedFiltersCount > 0 ? (
                  <Badge variant="default">{t('common.filters.appliedCount', { count: appliedFiltersCount })}</Badge>
                ) : (
                  <Badge variant="outline">{t('common.filters.noFilters')}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {t('subscriptionRequests.filtersDescription')}
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline">
                {filtersOpen ? (
                  <>
                    {t('common.actions.hideFilters')}
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('common.actions.showFilters')}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Select value={draftStatus} onValueChange={(value) => setDraftStatus(value as QueueStatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{subscriptionStatusLabel(t, 'pending')}</SelectItem>
                  <SelectItem value="not_pending">{subscriptionStatusLabel(t, 'not_pending')}</SelectItem>
                  <SelectItem value="approved">{subscriptionStatusLabel(t, 'approved')}</SelectItem>
                  <SelectItem value="rejected">{subscriptionStatusLabel(t, 'rejected')}</SelectItem>
                  <SelectItem value="all">{subscriptionStatusLabel(t, 'all')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={draftOnly}
                onValueChange={(value) => setDraftOnly(value as 'all' | SubscriptionRequestResolutionStatus)}
                disabled={!(draftStatus === 'all' || draftStatus === 'pending')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.filters.resolution')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{subscriptionResolutionLabel(t, 'all')}</SelectItem>
                  <SelectItem value="new">{subscriptionResolutionLabel(t, 'new')}</SelectItem>
                  <SelectItem value="ready_for_review">{subscriptionResolutionLabel(t, 'ready_for_review')}</SelectItem>
                  <SelectItem value="needs_person">{subscriptionResolutionLabel(t, 'needs_person')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={draftOrder} onValueChange={(value) => setDraftOrder(value as 'oldest' | 'newest')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.filters.order')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{orderLabel(t, 'newest')}</SelectItem>
                  <SelectItem value="oldest">{orderLabel(t, 'oldest')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(draftLimit)} onValueChange={(value) => setDraftLimit(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.filters.pageSize')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t('common.pagination.perPage', { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 md:col-span-2 lg:col-span-4 lg:justify-end">
                <Button type="button" variant="outline" onClick={() => void resetFilters()}>
                  {t('common.actions.reset')}
                </Button>
                <Button type="button" onClick={() => void applyFilters()}>
                  {t('common.actions.applyFilters')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {reviewError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('subscriptionRequests.reviewFailed')}</AlertTitle>
          <AlertDescription>{reviewError}</AlertDescription>
        </Alert>
      ) : null}

      {reviewResult ? (
        <Alert role="status" className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>{t('subscriptionRequests.reviewCompleted')}</AlertTitle>
          <AlertDescription>{reviewResult}</AlertDescription>
        </Alert>
      ) : null}

      {resolveError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('subscriptionRequests.resolveFailed')}</AlertTitle>
          <AlertDescription>{resolveError}</AlertDescription>
        </Alert>
      ) : null}

      {resolveResult ? (
        <Alert role="status" className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>{t('subscriptionRequests.resolveCompleted')}</AlertTitle>
          <AlertDescription>{resolveResult}</AlertDescription>
        </Alert>
      ) : null}

      {!adminTgUserId && canReview ? (
        <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
          <AlertTitle>{t('subscriptionRequests.telegramLinkRequired')}</AlertTitle>
          <AlertDescription>
            {t('subscriptionRequests.telegramLinkRequiredDescription')}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptionRequests.queueTitle')}</CardTitle>
          <CardDescription>
            {t('subscriptionRequests.queueRange', { from: rangeStart, to: rangeEnd, total })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SubscriptionRequestsTable
            requests={requests}
            loading={loading}
            canReview={canReview}
            hasAdminTgUserId={Boolean(adminTgUserId)}
            reviewingRequestId={reviewingRequestId}
            resolvingRequestId={resolvingRequestId}
            onReview={onReview}
            onResolvePerson={onResolvePerson}
          />

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={!canGoPrev || loading}
                  onClick={() => void goToPage(currentPage - 1)}
                />
              </PaginationItem>

              {paginationItems.map((item, index) => (
                <PaginationItem key={`${String(item)}-${index}`}>
                  {item === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
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
                <PaginationNext
                  disabled={!canGoNext || loading}
                  onClick={() => void goToPage(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  )
}
