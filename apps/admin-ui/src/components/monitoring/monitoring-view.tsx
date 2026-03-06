import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, RadioTower, RefreshCw, ServerCog, Workflow } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  MonitoringComponentsCard,
  MonitoringQueueBreakdownCard,
  MonitoringWorkersCard
} from './monitoring-sections'
import type { MonitoringSnapshot } from '@/lib/dashboard/types'
import { getMonitoringSnapshot } from '@/lib/dashboard/service'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { formatDateTime } from '@/lib/i18n/format'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MonitoringView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('monitoring.read') ?? false

  const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staleWorkers = useMemo(
    () => snapshot?.workers.filter((item) => item.status === 'stale').length ?? 0,
    [snapshot]
  )
  const downComponents = useMemo(
    () => snapshot?.components.filter((item) => item.status === 'down').length ?? 0,
    [snapshot]
  )
  const queueNew = snapshot?.accessEvents.counts.NEW ?? 0
  const outboxNew = snapshot?.outbox.counts.new ?? 0

  async function load() {
    setError(null)
    try {
      setSnapshot(await getMonitoringSnapshot())
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('dashboard.monitoringWidgetUnavailable'))
    }
  }

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }

    async function initialLoad() {
      setLoading(true)
      await load()
      setLoading(false)
    }

    void initialLoad()
  }, [canRead])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>
          {t('monitoring.accessDeniedDescription')}
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-28" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (error || !snapshot) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('dashboard.monitoringWidgetUnavailable')}</AlertTitle>
        <AlertDescription>{error ?? t('devices.monitoringUnavailable')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('app.nav.monitoring')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.subtitle', { value: formatDateTime(snapshot.now, '-') })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/devices/monitoring" className={cn(buttonVariants({ variant: 'outline' }))}>
            {t('app.nav.dsMonitoring')}
          </Link>
          <Button type="button" variant="outline" disabled={refreshing} onClick={() => void onRefresh()}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.workerHealth')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <ServerCog className="h-5 w-5 text-cyan-700" aria-hidden="true" />
              {staleWorkers}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('dashboard.staleWorkers', { count: staleWorkers })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.componentStatus')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
              {downComponents}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('dashboard.componentsDown', { count: downComponents })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.queuePressure')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <Workflow className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              {queueNew}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('monitoring.accessEventsNew')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('common.labels.outbox')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <RadioTower className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              {outboxNew}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('monitoring.outboxNew')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <MonitoringWorkersCard snapshot={snapshot} t={t} />
        <MonitoringComponentsCard snapshot={snapshot} t={t} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <MonitoringQueueBreakdownCard
          title={t('app.nav.accessEvents')}
          description={t('monitoring.oldestUnprocessed', {
            value: formatDateTime(snapshot.accessEvents.oldestUnprocessedOccurredAt, '-')
          })}
          counts={snapshot.accessEvents.counts}
          emptyLabel={t('common.empty.noMatches')}
        />
        <MonitoringQueueBreakdownCard
          title={t('common.labels.outbox')}
          description={t('devices.oldestPendingItem', {
            value: formatDateTime(snapshot.outbox.oldestNewCreatedAt, '-')
          })}
          counts={snapshot.outbox.counts}
          emptyLabel={t('common.empty.noMatches')}
        />
      </div>
    </div>
  )
}
