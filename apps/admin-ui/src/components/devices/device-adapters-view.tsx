import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Cable, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DeviceListPagination } from './device-list-pagination'
import { formatDateTime, formatDurationMs } from './device-ops-format'
import type { DeviceAdapterItem } from '@/lib/devices/types'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { listAdapters } from '@/lib/devices/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function DeviceAdaptersView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('devices.read') ?? false

  const [adapters, setAdapters] = useState<Array<DeviceAdapterItem>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<'all' | 'active' | 'draining'>('all')
  const [sortBy, setSortBy] = useState<'last_seen_desc' | 'last_seen_asc' | 'name_asc' | 'name_desc'>('last_seen_desc')
  const [limit, setLimit] = useState(12)
  const [page, setPage] = useState(1)

  const activeCount = useMemo(
    () => adapters.filter((adapter) => adapter.mode === 'active').length,
    [adapters]
  )
  const filteredAdapters = useMemo(() => {
    const lower = query.trim().toLowerCase()
    const next = adapters.filter((adapter) => {
      if (modeFilter !== 'all' && adapter.mode !== modeFilter) return false
      if (!lower) return true
      return [
        adapter.instanceName,
        adapter.instanceKey,
        adapter.vendorKey,
        adapter.adapterId,
        adapter.baseUrl
      ].some((value) => value.toLowerCase().includes(lower))
    })

    next.sort((left, right) => {
      if (sortBy === 'last_seen_desc') {
        return new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime()
      }
      if (sortBy === 'last_seen_asc') {
        return new Date(left.lastSeenAt).getTime() - new Date(right.lastSeenAt).getTime()
      }
      if (sortBy === 'name_asc') {
        return left.instanceName.localeCompare(right.instanceName)
      }
      return right.instanceName.localeCompare(left.instanceName)
    })

    return next
  }, [adapters, modeFilter, query, sortBy])
  const totalPages = Math.max(1, Math.ceil(filteredAdapters.length / limit))
  const pageSafe = Math.min(page, totalPages)
  const pagedAdapters = useMemo(() => {
    const offset = (pageSafe - 1) * limit
    return filteredAdapters.slice(offset, offset + limit)
  }, [filteredAdapters, limit, pageSafe])
  const rangeStart = filteredAdapters.length === 0 ? 0 : (pageSafe - 1) * limit + 1
  const rangeEnd = filteredAdapters.length === 0 ? 0 : Math.min(pageSafe * limit, filteredAdapters.length)

  useEffect(() => {
    setPage(1)
  }, [limit, modeFilter, query, sortBy])

  async function load() {
    setError(null)
    try {
      setAdapters(await listAdapters())
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('devices.adaptersLoadFailed'))
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
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('devices.adaptersPageLoadFailedTitle')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('devices.adaptersOpsTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('devices.adaptersOpsSubtitle')}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.totalAdapters')}</CardDescription>
            <CardTitle className="text-2xl">{adapters.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.activeMode')}</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('devices.drainingMode')}</CardDescription>
            <CardTitle className="text-2xl">{adapters.length - activeCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder={t('devices.searchInstanceVendorUrl')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select value={modeFilter} onValueChange={(value) => setModeFilter(value as typeof modeFilter)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.labels.mode')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('devices.allModes')}</SelectItem>
              <SelectItem value="active">{t('devices.active')}</SelectItem>
              <SelectItem value="draining">{t('devices.draining')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.filters.order')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_seen_desc">{t('devices.sort.lastSeenNewest')}</SelectItem>
              <SelectItem value="last_seen_asc">{t('devices.sort.lastSeenOldest')}</SelectItem>
              <SelectItem value="name_asc">{t('devices.sort.nameAsc')}</SelectItem>
              <SelectItem value="name_desc">{t('devices.sort.nameDesc')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.filters.pageSize')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">{t('common.pagination.perPage', { count: 6 })}</SelectItem>
              <SelectItem value="12">{t('common.pagination.perPage', { count: 12 })}</SelectItem>
              <SelectItem value="24">{t('common.pagination.perPage', { count: 24 })}</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground self-center">
            {t('devices.adaptersRange', { from: rangeStart, to: rangeEnd, total: filteredAdapters.length })}
          </div>
        </div>
        {pagedAdapters.map((adapter) => (
          <Card key={adapter.adapterId} className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Cable className="h-4 w-4 text-cyan-700" />
                  {adapter.instanceName}
                </span>
                <Badge variant={adapter.mode === 'active' ? 'default' : 'outline'}>
                  {adapter.mode === 'active' ? t('devices.active') : t('devices.draining')}
                </Badge>
              </CardTitle>
              <CardDescription>{adapter.vendorKey} | {adapter.adapterId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">{t('devices.instanceKey')}:</span> {adapter.instanceKey}</p>
              <p><span className="text-muted-foreground">{t('devices.baseUrl')}:</span> {adapter.baseUrl}</p>
              <p><span className="text-muted-foreground">{t('devices.retention')}:</span> {formatDurationMs(adapter.retentionMs)}</p>
              <p><span className="text-muted-foreground">{t('devices.capabilities')}:</span> {adapter.capabilities.length > 0 ? adapter.capabilities.join(', ') : t('devices.notDeclared')}</p>
              <p><span className="text-muted-foreground">{t('devices.version')}:</span> {adapter.version ?? t('devices.noValue')}</p>
              <p><span className="text-muted-foreground">{t('devices.registered')}:</span> {formatDateTime(adapter.registeredAt)}</p>
              <p><span className="text-muted-foreground">{t('common.labels.lastSeen')}:</span> {formatDateTime(adapter.lastSeenAt)}</p>
            </CardContent>
          </Card>
        ))}
        <div className="md:col-span-2">
          <DeviceListPagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {filteredAdapters.length === 0 ? (
        <Alert>
          <AlertTitle>{t('devices.noAdaptersRegistered')}</AlertTitle>
          <AlertDescription>
            {t('devices.noAdaptersRegisteredDescription')}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
