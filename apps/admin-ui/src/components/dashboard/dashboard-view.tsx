import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  Clock3,
  RefreshCw,
  ServerCog,
  UserRoundCheck
} from 'lucide-react'

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
              value instanceof Error ? value.message : 'Failed to load monitoring widget'
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
              value instanceof Error ? value.message : 'Failed to load requests widget'
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
  const staleLabel = workerStaleCount === 1 ? 'worker stale' : 'workers stale'
  const componentLabel =
    componentDownCount === 1 ? 'component down' : 'components down'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Operations dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last snapshot: {formatDate(monitoring?.now ?? null)}
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
          {refreshing ? 'Refreshing…' : 'Refresh data'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canViewMonitoring ? (
          <>
            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Worker health</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ServerCog className="h-5 w-5 text-cyan-600" />
                  {workerStaleCount === 0 ? 'All healthy' : `${workerStaleCount} stale`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {workerCount} workers tracked
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Queue pressure</CardDescription>
                <CardTitle className="text-2xl">{queueNew + outboxNew}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                access_events.NEW: {queueNew} · outbox.new: {outboxNew}
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Component status</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  {componentDownCount === 0 ? 'Operational' : `${componentDownCount} down`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Total components: {monitoring?.components.length ?? 0}
              </CardContent>
            </Card>

            <Card className="border-border/80 transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Risk summary</CardDescription>
                <CardTitle className="text-2xl">{workerStaleCount + componentDownCount}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{workerStaleCount} {staleLabel}</p>
                <p>{componentDownCount} {componentLabel}</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {canViewMonitoring && monitoringError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Monitoring widget unavailable</AlertTitle>
          <AlertDescription>{monitoringError}</AlertDescription>
        </Alert>
      ) : null}

      {canViewRequests ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-emerald-700" />
              Recent subscription requests
            </CardTitle>
            <CardDescription>Latest incoming requests needing review</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsError ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>Requests widget unavailable</AlertTitle>
                <AlertDescription>{requestsError}</AlertDescription>
              </Alert>
            ) : requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No requests found.
              </div>
            ) : (
              <div className="rounded-lg border border-border/80">
                <Table>
                  <caption className="sr-only">
                    Recent subscription requests requiring admin review.
                  </caption>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>IIN</TableHead>
                      <TableHead>Telegram ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Created At</TableHead>
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
          <AlertTitle>No available widgets</AlertTitle>
          <AlertDescription>
            Your role has access to dashboard, but no widgets are available with current permissions.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

