import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  Clock3,
  RefreshCw,
  ServerCog,
  UserRoundCheck
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { MonitoringSnapshot, PendingRequestItem } from '@/lib/dashboard/types'
import { getMonitoringSnapshot, getPendingRequests } from '@/lib/dashboard/service'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { formatDateTime } from '@/lib/i18n/format'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

function formatDate(value: string | null) {
  return formatDateTime(value, '-')
}

export function DashboardView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canViewMonitoring = permissions.includes('monitoring.read')
  const canViewRequests =
    permissions.includes('subscriptions.read') ||
    permissions.includes('subscriptions.review')
  const hasVisibleWidgets = canViewMonitoring || canViewRequests

  const [monitoring, setMonitoring] = useState<MonitoringSnapshot | null>(null)
  const [requests, setRequests] = useState<Array<PendingRequestItem>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monitoringError, setMonitoringError] = useState<string | null>(null)
  const [requestsError, setRequestsError] = useState<string | null>(null)

  async function load(activeRef?: { current: boolean }) {
    setMonitoringError(null)
    setRequestsError(null)

    try {
      const tasks: Array<Promise<void>> = []

      if (canViewMonitoring) {
        tasks.push((async () => {
          try {
            const snapshot = await getMonitoringSnapshot()
            if (activeRef && !activeRef.current) {
              return
            }
            setMonitoring(snapshot)
          } catch (value) {
            if (activeRef && !activeRef.current) {
              return
            }
            if (value instanceof ApiError && value.code === 'server_unreachable') {
              throw value
            }
            if (value instanceof ApiError && value.status === 403) {
              setMonitoring(null)
              return
            }
            setMonitoringError(
              value instanceof Error ? value.message : t('dashboard.monitoringWidgetUnavailable')
            )
            setMonitoring(null)
          }
        })())
      } else {
        setMonitoring(null)
      }

      if (canViewRequests) {
        tasks.push((async () => {
          try {
            const pending = await getPendingRequests(8)
            if (activeRef && !activeRef.current) {
              return
            }
            setRequests(pending)
          } catch (value) {
            if (activeRef && !activeRef.current) {
              return
            }
            if (value instanceof ApiError && value.code === 'server_unreachable') {
              throw value
            }
            if (value instanceof ApiError && value.status === 403) {
              setRequests([])
              return
            }
            setRequestsError(
              value instanceof Error ? value.message : t('dashboard.requestsWidgetUnavailable')
            )
            setRequests([])
          }
        })())
      } else {
        setRequests([])
      }

      await Promise.all(tasks)
    } catch (value) {
      if (activeRef && !activeRef.current) {
        return
      }
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
      }
    }
  }

  useEffect(() => {
    const activeRef = { current: true }

    async function initialLoad() {
      setLoading(true)
      await load(activeRef)
      if (activeRef.current) {
        setLoading(false)
      }
    }

    void initialLoad()

    return () => {
      activeRef.current = false
    }
  }, [canViewMonitoring, canViewRequests, router])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading && hasVisibleWidgets) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  const workerStaleCount =
    monitoring?.workers.filter((item) => item.status === 'stale').length ?? 0
  const componentDownCount =
    monitoring?.components.filter((item) => item.status === 'down').length ?? 0
  const queueNew = monitoring?.accessEvents.counts.NEW ?? 0
  const outboxNew = monitoring?.outbox.counts.new ?? 0
  const workerCount = monitoring?.workers.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.subtitle', { value: formatDate(monitoring?.now ?? null) })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={onRefresh}
          className="sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canViewMonitoring ? (
          <>
            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.workerHealth')}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ServerCog className="h-5 w-5 text-cyan-600" />
                  {workerStaleCount === 0 ? t('dashboard.allHealthy') : t('dashboard.staleCount', { count: workerStaleCount })}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('dashboard.workersTracked', { count: workerCount })}
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.queuePressure')}</CardDescription>
                <CardTitle className="text-2xl">{queueNew + outboxNew}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('monitoring.accessEventsNew')}: {queueNew} · {t('monitoring.outboxNew')}: {outboxNew}
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.componentStatus')}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  {componentDownCount === 0 ? t('dashboard.operational') : t('dashboard.downCount', { count: componentDownCount })}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('dashboard.totalComponents', { count: monitoring?.components.length ?? 0 })}
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.riskSummary')}</CardDescription>
                <CardTitle className="text-2xl">{workerStaleCount + componentDownCount}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{t('dashboard.staleWorkers', { count: workerStaleCount })}</p>
                <p>{t('dashboard.componentsDown', { count: componentDownCount })}</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {canViewMonitoring && monitoringError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('dashboard.monitoringWidgetUnavailable')}</AlertTitle>
          <AlertDescription>{monitoringError}</AlertDescription>
        </Alert>
      ) : null}

      {canViewRequests ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-emerald-700" />
              {t('dashboard.requestsTitle')}
            </CardTitle>
            <CardDescription>{t('dashboard.requestsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsError ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>{t('dashboard.requestsWidgetUnavailable')}</AlertTitle>
                <AlertDescription>{requestsError}</AlertDescription>
              </Alert>
            ) : requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                {t('dashboard.noRequests')}
              </div>
            ) : (
              <div className="rounded-lg border border-border/80">
                <Table>
                  <caption className="sr-only">
                    Recent subscription requests requiring admin review.
                  </caption>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t('common.labels.iin')}</TableHead>
                      <TableHead>{t('common.labels.telegram')}</TableHead>
                      <TableHead>{t('common.labels.status')}</TableHead>
                      <TableHead className="text-right">{t('common.labels.created')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.iin}</TableCell>
                        <TableCell className="text-muted-foreground">{request.tgUserId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.resolutionStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDate(request.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!hasVisibleWidgets ? (
        <Alert>
          <AlertTitle>{t('dashboard.noWidgetsTitle')}</AlertTitle>
          <AlertDescription>
            {t('dashboard.noWidgetsDescription')}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
