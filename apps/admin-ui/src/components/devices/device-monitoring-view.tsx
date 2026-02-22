import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Activity, Package, RefreshCw, Server, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DeviceListPagination } from './device-list-pagination'
import { formatDateTime, formatDurationMs, statusBadgeVariant } from './device-ops-format'
import type { DeviceMonitoringSnapshot } from '@/lib/devices/types'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { getMonitoringSnapshot } from '@/lib/devices/service'
import { monitoringStatusLabel } from '@/lib/i18n/enum-labels'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

export function DeviceMonitoringView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('devices.read') ?? false

  const [snapshot, setSnapshot] = useState<DeviceMonitoringSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adapterQuery, setAdapterQuery] = useState('')
  const [adapterStatusFilter, setAdapterStatusFilter] = useState<'all' | 'ok' | 'stale'>('all')
  const [adapterLimit, setAdapterLimit] = useState(10)
  const [adapterPage, setAdapterPage] = useState(1)
  const [deviceQuery, setDeviceQuery] = useState('')
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<'all' | 'ok' | 'stale'>('all')
  const [deviceLimit, setDeviceLimit] = useState(10)
  const [devicePage, setDevicePage] = useState(1)

  const staleAdaptersCount = useMemo(
    () => snapshot?.adapters.filter((adapter) => adapter.status === 'stale').length ?? 0,
    [snapshot]
  )
  const staleDevicesCount = useMemo(
    () => snapshot?.devices.filter((device) => device.status === 'stale').length ?? 0,
    [snapshot]
  )
  const pendingOutboxCount = useMemo(() => {
    if (!snapshot) {
      return 0
    }
    return Object.entries(snapshot.outbox.counts).reduce((total, [key, count]) => {
      if (key === 'processed') {
        return total
      }
      return total + count
    }, 0)
  }, [snapshot])
  const filteredAdapters = useMemo(() => {
    const source = snapshot?.adapters ?? []
    const lower = adapterQuery.trim().toLowerCase()
    const next = source.filter((adapter) => {
      if (adapterStatusFilter !== 'all' && adapter.status !== adapterStatusFilter) return false
      if (!lower) return true
      return [
        adapter.instanceName,
        adapter.instanceKey,
        adapter.adapterId,
        adapter.vendorKey
      ].some((value) => value.toLowerCase().includes(lower))
    })
    next.sort((left, right) => new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime())
    return next
  }, [adapterQuery, adapterStatusFilter, snapshot])
  const filteredDevices = useMemo(() => {
    const source = snapshot?.devices ?? []
    const lower = deviceQuery.trim().toLowerCase()
    const next = source.filter((device) => {
      if (deviceStatusFilter !== 'all' && device.status !== deviceStatusFilter) return false
      if (!lower) return true
      return [
        device.deviceId,
        device.name ?? '',
        device.adapterKey
      ].some((value) => value.toLowerCase().includes(lower))
    })
    next.sort((left, right) => {
      const leftTime = left.lastEventAt ? new Date(left.lastEventAt).getTime() : 0
      const rightTime = right.lastEventAt ? new Date(right.lastEventAt).getTime() : 0
      return rightTime - leftTime
    })
    return next
  }, [deviceQuery, deviceStatusFilter, snapshot])
  const adapterTotalPages = Math.max(1, Math.ceil(filteredAdapters.length / adapterLimit))
  const adapterPageSafe = Math.min(adapterPage, adapterTotalPages)
  const pagedAdapters = useMemo(() => {
    const offset = (adapterPageSafe - 1) * adapterLimit
    return filteredAdapters.slice(offset, offset + adapterLimit)
  }, [adapterLimit, adapterPageSafe, filteredAdapters])
  const deviceTotalPages = Math.max(1, Math.ceil(filteredDevices.length / deviceLimit))
  const devicePageSafe = Math.min(devicePage, deviceTotalPages)
  const pagedDevices = useMemo(() => {
    const offset = (devicePageSafe - 1) * deviceLimit
    return filteredDevices.slice(offset, offset + deviceLimit)
  }, [deviceLimit, devicePageSafe, filteredDevices])

  useEffect(() => {
    setAdapterPage(1)
  }, [adapterLimit, adapterQuery, adapterStatusFilter])

  useEffect(() => {
    setDevicePage(1)
  }, [deviceLimit, deviceQuery, deviceStatusFilter])

  async function load() {
    setError(null)
    try {
      setSnapshot(await getMonitoringSnapshot())
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('devices.monitoringLoadFailed'))
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
          {t('devices.accessDeniedDescription')}
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (error || !snapshot) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('devices.monitoringFailed')}</AlertTitle>
        <AlertDescription>{error ?? t('devices.monitoringUnavailable')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('devices.monitoringTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('devices.monitoringSubtitle')}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.adaptersStale')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Server className="h-5 w-5 text-cyan-700" />
              {staleAdaptersCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.devicesStale')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-5 w-5 text-cyan-700" />
              {staleDevicesCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.outboxPending')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Package className="h-5 w-5 text-cyan-700" />
              {pendingOutboxCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.outboxOldestNew')}</CardDescription>
            <CardTitle className="text-sm">{formatDateTime(snapshot.outbox.oldestNewCreatedAt)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('devices.adaptersHealthTitle')}</CardTitle>
          <CardDescription>{t('devices.adaptersHealthDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder={t('common.placeholders.searchAdapter')}
              value={adapterQuery}
              onChange={(event) => setAdapterQuery(event.target.value)}
            />
            <Select value={adapterStatusFilter} onValueChange={(value) => setAdapterStatusFilter(value as typeof adapterStatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{monitoringStatusLabel(t, 'all')}</SelectItem>
                <SelectItem value="ok">{monitoringStatusLabel(t, 'ok')}</SelectItem>
                <SelectItem value="stale">{monitoringStatusLabel(t, 'stale')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(adapterLimit)} onValueChange={(value) => setAdapterLimit(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.pageSize')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('common.pagination.perPage', { count: 10 })}</SelectItem>
                <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
              </SelectContent>
            </Select>
            <p className="self-center text-xs text-muted-foreground">
              {t('common.pagination.range', {
                from: filteredAdapters.length === 0 ? 0 : (adapterPageSafe - 1) * adapterLimit + 1,
                to: Math.min(adapterPageSafe * adapterLimit, filteredAdapters.length),
                total: filteredAdapters.length
              })}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.labels.instance')}</TableHead>
                <TableHead>{t('common.labels.adapter')}</TableHead>
                <TableHead>{t('common.labels.vendor')}</TableHead>
                <TableHead>{t('common.labels.mode')}</TableHead>
                <TableHead>{t('common.labels.status')}</TableHead>
                <TableHead>{t('common.labels.lastSeen')}</TableHead>
                <TableHead>{t('common.labels.ttl')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedAdapters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.empty.noAdapterTelemetry')}</TableCell>
                </TableRow>
              ) : (
                pagedAdapters.map((adapter) => (
                  <TableRow key={adapter.adapterId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{adapter.instanceName}</p>
                        <p className="text-xs text-muted-foreground">{adapter.instanceKey}</p>
                      </div>
                    </TableCell>
                    <TableCell>{adapter.adapterId}</TableCell>
                    <TableCell>{adapter.vendorKey}</TableCell>
                    <TableCell><Badge variant="outline">{adapter.mode}</Badge></TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(adapter.status)}>{monitoringStatusLabel(t, adapter.status)}</Badge></TableCell>
                    <TableCell>{formatDateTime(adapter.lastSeenAt)}</TableCell>
                    <TableCell>{formatDurationMs(adapter.ttlMs)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-3">
            <DeviceListPagination currentPage={adapterPageSafe} totalPages={adapterTotalPages} onPageChange={setAdapterPage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('devices.devicesHealthTitle')}</CardTitle>
          <CardDescription>{t('devices.devicesHealthDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder={t('common.placeholders.searchDevice')}
              value={deviceQuery}
              onChange={(event) => setDeviceQuery(event.target.value)}
            />
            <Select value={deviceStatusFilter} onValueChange={(value) => setDeviceStatusFilter(value as typeof deviceStatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{monitoringStatusLabel(t, 'all')}</SelectItem>
                <SelectItem value="ok">{monitoringStatusLabel(t, 'ok')}</SelectItem>
                <SelectItem value="stale">{monitoringStatusLabel(t, 'stale')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(deviceLimit)} onValueChange={(value) => setDeviceLimit(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.pageSize')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('common.pagination.perPage', { count: 10 })}</SelectItem>
                <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
              </SelectContent>
            </Select>
            <p className="self-center text-xs text-muted-foreground">
              {t('common.pagination.range', {
                from: filteredDevices.length === 0 ? 0 : (devicePageSafe - 1) * deviceLimit + 1,
                to: Math.min(devicePageSafe * deviceLimit, filteredDevices.length),
                total: filteredDevices.length
              })}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.labels.device')}</TableHead>
                <TableHead>{t('common.labels.name')}</TableHead>
                <TableHead>{t('common.labels.adapter')}</TableHead>
                <TableHead>{t('common.labels.status')}</TableHead>
                <TableHead>{t('common.labels.lastEvent')}</TableHead>
                <TableHead>{t('common.labels.ttl')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.empty.noDeviceTelemetry')}</TableCell>
                </TableRow>
              ) : (
                pagedDevices.map((device) => (
                  <TableRow key={device.deviceId}>
                    <TableCell>{device.deviceId}</TableCell>
                    <TableCell>{device.name ?? t('devices.noValue')}</TableCell>
                    <TableCell>{device.adapterKey}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(device.status)}>{monitoringStatusLabel(t, device.status)}</Badge></TableCell>
                    <TableCell>{formatDateTime(device.lastEventAt)}</TableCell>
                    <TableCell>{formatDurationMs(device.ttlMs)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-3">
            <DeviceListPagination currentPage={devicePageSafe} totalPages={deviceTotalPages} onPageChange={setDevicePage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.labels.outbox')}</CardTitle>
          <CardDescription>{t('devices.outboxDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(snapshot.outbox.counts).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground uppercase">{key}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          {pendingOutboxCount > 0 ? (
            <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
              <AlertTitle className="flex items-center gap-1.5">
                <TriangleAlert className="h-4 w-4" />
                {t('devices.pendingOutboxDetected')}
              </AlertTitle>
              <AlertDescription>
                {t('devices.oldestPendingItem', { value: formatDateTime(snapshot.outbox.oldestNewCreatedAt) })}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
