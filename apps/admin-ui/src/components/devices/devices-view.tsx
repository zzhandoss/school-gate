import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DeviceListPagination } from './device-list-pagination'
import { DevicesTable } from './devices-table'
import { DevicesUpsertPanel } from './devices-upsert-panel'
import type { DeviceAdapterItem, DeviceItem, DeviceUpdateInput, DeviceUpsertInput } from '@/lib/devices/types'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { createDevice, listAdapters, listDevices, removeDevice, setDeviceEnabled, updateDevice } from '@/lib/devices/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function DevicesView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canRead = permissions.includes('devices.read')
  const canWrite = permissions.includes('devices.write')

  const [devices, setDevices] = useState<Array<DeviceItem>>([])
  const [adapters, setAdapters] = useState<Array<DeviceAdapterItem>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [adapterFilter, setAdapterFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc'>('updated_desc')
  const [limit, setLimit] = useState(20)
  const [page, setPage] = useState(1)

  const enabledCount = useMemo(() => devices.filter((device) => device.enabled).length, [devices])
  const adapterOptions = useMemo(() => {
    const unique = Array.from(new Set(devices.map((device) => device.adapterKey)))
    return unique.sort((a, b) => a.localeCompare(b))
  }, [devices])
  const filteredDevices = useMemo(() => {
    const lower = query.trim().toLowerCase()
    const next = devices.filter((device) => {
      if (enabledFilter === 'enabled' && !device.enabled) return false
      if (enabledFilter === 'disabled' && device.enabled) return false
      if (adapterFilter !== 'all' && device.adapterKey !== adapterFilter) return false
      if (!lower) return true
      return [device.name, device.deviceId, device.adapterKey].some((value) =>
        value.toLowerCase().includes(lower)
      )
    })

    next.sort((left, right) => {
      if (sortBy === 'updated_desc') {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      }
      if (sortBy === 'updated_asc') {
        return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
      }
      if (sortBy === 'name_asc') {
        return left.name.localeCompare(right.name)
      }
      return right.name.localeCompare(left.name)
    })

    return next
  }, [adapterFilter, devices, enabledFilter, query, sortBy])
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / limit))
  const pageSafe = Math.min(page, totalPages)
  const pagedDevices = useMemo(() => {
    const offset = (pageSafe - 1) * limit
    return filteredDevices.slice(offset, offset + limit)
  }, [filteredDevices, limit, pageSafe])
  const rangeStart = filteredDevices.length === 0 ? 0 : (pageSafe - 1) * limit + 1
  const rangeEnd = filteredDevices.length === 0 ? 0 : Math.min(pageSafe * limit, filteredDevices.length)

  useEffect(() => {
    setPage(1)
  }, [adapterFilter, enabledFilter, limit, query, sortBy])

  async function load() {
    setError(null)
    try {
      const [nextDevices, nextAdapters] = await Promise.all([listDevices(), listAdapters()])
      setDevices(nextDevices)
      setAdapters(nextAdapters)
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      setError(value instanceof Error ? value.message : t('devices.opsLoadFailed'))
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

  async function onCreate(input: DeviceUpsertInput | DeviceUpdateInput) {
    await createDevice(input as DeviceUpsertInput)
    await load()
  }

  async function onUpdate(deviceId: string, input: DeviceUpdateInput) {
    await updateDevice(deviceId, input)
    await load()
  }

  async function onToggle(deviceId: string, enabled: boolean) {
    await setDeviceEnabled(deviceId, enabled)
    await load()
  }

  async function onDelete(deviceId: string) {
    await removeDevice(deviceId)
    await load()
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

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('devices.opsPageLoadFailedTitle')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('devices.opsTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('devices.opsSubtitle')}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <DevicesUpsertPanel
            mode="create"
            adapters={adapters}
            canWrite={canWrite}
            onSubmit={onCreate}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 sm:h-9 sm:flex-none"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.totalDevices')}</CardDescription>
            <CardTitle className="text-2xl">{devices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.enabled')}</CardDescription>
            <CardTitle className="text-2xl">{enabledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.writableScope')}</CardDescription>
            <CardTitle className="text-base">
              <Badge variant={canWrite ? 'default' : 'outline'}>{canWrite ? t('devices.writeGranted') : t('dashboard.readOnly')}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('devices.registryTitle')}</CardTitle>
          <CardDescription>
            {t('devices.registryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder={t('devices.searchDeviceIdAdapter')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select value={enabledFilter} onValueChange={(value) => setEnabledFilter(value as typeof enabledFilter)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('enums.monitoringStatus.all')}</SelectItem>
                <SelectItem value="enabled">{t('devices.enabled')}</SelectItem>
                <SelectItem value="disabled">{t('settings.disabled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={adapterFilter} onValueChange={setAdapterFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.labels.adapter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('devices.allAdapters')}</SelectItem>
                {adapterOptions.map((adapterKey) => (
                  <SelectItem key={adapterKey} value={adapterKey}>
                    {adapterKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.order')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">{t('devices.sort.updatedNewest')}</SelectItem>
                <SelectItem value="updated_asc">{t('devices.sort.updatedOldest')}</SelectItem>
                <SelectItem value="name_asc">{t('devices.sort.nameAsc')}</SelectItem>
                <SelectItem value="name_desc">{t('devices.sort.nameDesc')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filters.pageSize')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('common.pagination.perPage', { count: 10 })}</SelectItem>
                <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DevicesTable
            devices={pagedDevices}
            adapters={adapters}
            canWrite={canWrite}
            onUpdate={onUpdate}
            onToggleEnabled={onToggle}
            onDelete={onDelete}
          />
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {t('devices.range', { from: rangeStart, to: rangeEnd, total: filteredDevices.length })}
            </p>
            <DeviceListPagination
              currentPage={pageSafe}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      {!canWrite ? (
        <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            {t('devices.restrictedModeTitle')}
          </p>
          <p className="mt-1">
            {t('devices.restrictedModeDescription')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
