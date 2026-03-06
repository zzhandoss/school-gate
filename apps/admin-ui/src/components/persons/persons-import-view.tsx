import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PersonsImportDevicePicker } from './persons-import-device-picker'
import { getPersonsImportErrorMessage, logPersonsImportError } from './persons-import-errors'
import {
  buildApplyPayload,
  formatApplySummary,
  formatImportSummary,
  getAvailableActions,
  isActionableStatus
} from './persons-import-helpers'
import { getPersonsImportStrings } from './persons-import-strings'
import { PersonsImportSummary } from './persons-import-summary'
import { PersonsImportTable } from './persons-import-table'
import type { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import type { PersonsImportAction } from './persons-import-helpers'
import type { DeviceItem } from '@/lib/devices/types'
import type {
  PersonImportCandidateGroup,
  PersonImportCandidateStatus,
  PersonImportRun
} from '@/lib/persons/types'
import { listDevices } from '@/lib/devices/service'
import {
  applyPersonsImport,
  createPersonsImportRun,
  listPersonsImportCandidates
} from '@/lib/persons/service'
import { useSession } from '@/lib/auth/session-store'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type FilterTab = 'all' | 'actionable' | PersonImportCandidateStatus

type PersonsImportErrorState = {
  title: string
  message: string
}

function getEligibleDevices(devices: Array<DeviceItem>) {
  return devices.filter((device) => device.enabled)
}

function createEmptySummary(): Record<PersonImportCandidateStatus, number> {
  return {
    ready_create: 0,
    ready_link: 0,
    already_linked: 0,
    conflict: 0,
    missing_iin: 0,
    stale_terminal_record: 0
  }
}

function getStatusesForTab(tab: FilterTab): Array<PersonImportCandidateStatus> | undefined {
  if (tab === 'all') {
    return undefined
  }
  if (tab === 'actionable') {
    return ['ready_create', 'ready_link', 'conflict']
  }
  return [tab]
}

export function PersonsImportView() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const strings = getPersonsImportStrings(i18n.language)
  const canRead = session?.admin.permissions.includes('persons.read') ?? false
  const canWrite = session?.admin.permissions.includes('persons.write') ?? false

  const [devices, setDevices] = useState<Array<DeviceItem>>([])
  const [eligibleDevices, setEligibleDevices] = useState<Array<DeviceItem>>([])
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Array<string>>([])
  const [filterDeviceId, setFilterDeviceId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [includeStale, setIncludeStale] = useState(true)
  const [includeCards, setIncludeCards] = useState(true)
  const [pageSize, setPageSize] = useState('100')
  const [tab, setTab] = useState<FilterTab>('actionable')
  const [groups, setGroups] = useState<Array<PersonImportCandidateGroup>>([])
  const [summary, setSummary] = useState<Record<PersonImportCandidateStatus, number>>(createEmptySummary)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<PersonsImportErrorState | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<PersonImportRun | null>(null)

  const selectedGroups = useMemo(
    () => groups.filter((group) => rowSelection[group.groupKey]),
    [groups, rowSelection]
  )
  const availableActions = useMemo(
    () => getAvailableActions(selectedGroups),
    [selectedGroups]
  )

  async function loadData() {
    setError(null)
    const [devicesResult, candidatesResult] = await Promise.allSettled([
      listDevices(),
      listPersonsImportCandidates({
        status: getStatusesForTab(tab),
        deviceId: filterDeviceId === 'all' ? undefined : filterDeviceId,
        query: query.trim() || undefined,
        includeStale,
        limit: 200,
        offset: 0
      })
    ])

    if (devicesResult.status === 'rejected' && devicesResult.reason instanceof ApiError && devicesResult.reason.code === 'server_unreachable') {
      await router.navigate({ to: '/unavailable' })
      return
    }
    if (candidatesResult.status === 'rejected' && candidatesResult.reason instanceof ApiError && candidatesResult.reason.code === 'server_unreachable') {
      await router.navigate({ to: '/unavailable' })
      return
    }

    if (devicesResult.status === 'fulfilled') {
      const nextEligibleDevices = getEligibleDevices(devicesResult.value)
      setDevices(devicesResult.value)
      setEligibleDevices(nextEligibleDevices)
      setSelectedDeviceIds((current) => {
        if (current.length > 0) {
          return current.filter((deviceId) => nextEligibleDevices.some((device) => device.deviceId === deviceId))
        }
        return nextEligibleDevices.map((device) => device.deviceId)
      })
    } else {
      setDevices([])
      setEligibleDevices([])
      setSelectedDeviceIds([])
    }

    if (candidatesResult.status === 'fulfilled') {
      setGroups(candidatesResult.value.groups)
      setSummary(candidatesResult.value.summary)
    } else {
      setGroups([])
      setSummary(createEmptySummary())
    }

    const firstError =
      devicesResult.status === 'rejected'
        ? devicesResult.reason
        : candidatesResult.status === 'rejected'
          ? candidatesResult.reason
          : null

    if (firstError) {
      logPersonsImportError('loadData', firstError, {
        filterDeviceId,
        includeStale,
        query,
        tab
      })
      setError({
        title: strings.loadFailedTitle,
        message: getPersonsImportErrorMessage(firstError, strings.loadFailedDescription)
      })
    }
  }

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }

    async function run() {
      setLoading(true)
      await loadData()
      setLoading(false)
    }

    void run()
  }, [canRead, filterDeviceId, includeStale, query, tab])

  async function onSync() {
    if (!canWrite || selectedDeviceIds.length === 0) {
      return
    }

    setActionMessage(null)
    setSyncing(true)
    try {
      const run = await createPersonsImportRun({
        deviceIds: selectedDeviceIds,
        includeCards,
        pageSize: Number(pageSize)
      })
      setLastRun(run)
      setRowSelection({})
      setExpanded({})
      await loadData()
    } catch (value) {
      logPersonsImportError('sync', value, {
        selectedDeviceIds,
        includeCards,
        pageSize
      })
      setError({
        title: strings.syncFailedTitle,
        message: getPersonsImportErrorMessage(value, strings.syncFailedTitle)
      })
    } finally {
      setSyncing(false)
    }
  }

  async function onApply(action: PersonsImportAction) {
    if (!canWrite) {
      return
    }

    const payload = buildApplyPayload(action, selectedGroups)
    if (payload.operations.length === 0) {
      setActionMessage(strings.noRowsSelected)
      return
    }

    setApplying(true)
    setActionMessage(null)
    try {
      const result = await applyPersonsImport(payload)
      setActionMessage(formatApplySummary(strings.applySummary, result))
      setRowSelection({})
      setExpanded({})
      await loadData()
    } catch (value) {
      logPersonsImportError('apply', value, {
        action,
        selectedGroupKeys: selectedGroups.map((group) => group.groupKey)
      })
      setError({
        title: strings.applyFailedTitle,
        message: getPersonsImportErrorMessage(value, strings.applyFailedTitle)
      })
    } finally {
      setApplying(false)
    }
  }

  function toggleDeviceSelection(deviceId: string) {
    setSelectedDeviceIds((current) =>
      current.includes(deviceId)
        ? current.filter((value) => value !== deviceId)
        : [...current, deviceId]
    )
  }

  function toggleAllDevices(checked: boolean) {
    setSelectedDeviceIds(checked ? eligibleDevices.map((device) => device.deviceId) : [])
  }

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>{t('persons.accessDeniedDescription')}</AlertDescription>
      </Alert>
    )
  }

  const actionableOnly = tab === 'actionable'
  const selectedCount = selectedGroups.length
  const summaryLine = lastRun
    ? formatImportSummary(strings.runSummary, {
        processed: lastRun.summary.processedDeviceCount,
        devices: lastRun.summary.deviceCount,
        entries: lastRun.summary.entryCount,
        errors: lastRun.summary.errorCount
      })
    : null
  const lastRunErrors = lastRun?.summary.errors ?? []

  return (
    <div className="space-y-4">
      <Card className="bg-card/70">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardTitle>{strings.title}</CardTitle>
            <CardDescription>{strings.subtitle}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={!canWrite || syncing || selectedDeviceIds.length === 0} onClick={() => void onSync()}>
              {syncing ? strings.syncing : strings.sync}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {eligibleDevices.length === 0 ? (
            <Alert>
              <AlertTitle>{strings.syncFailedTitle}</AlertTitle>
              <AlertDescription>{strings.noEligibleDevices}</AlertDescription>
            </Alert>
          ) : (
            <PersonsImportDevicePicker
              devices={eligibleDevices}
              selectedDeviceIds={selectedDeviceIds}
              disabled={syncing}
              strings={strings}
              onToggleDevice={toggleDeviceSelection}
              onToggleAllDevices={toggleAllDevices}
            />
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder={strings.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
            <Select value={filterDeviceId} onValueChange={setFilterDeviceId}>
              <SelectTrigger><SelectValue placeholder={strings.devicePlaceholder} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.allDevices}</SelectItem>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>{device.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger><SelectValue placeholder={strings.pageSize} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span>{strings.includeCards}</span>
                <Switch checked={includeCards} onCheckedChange={setIncludeCards} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>{strings.includeStale}</span>
                <Switch checked={includeStale} onCheckedChange={setIncludeStale} />
              </label>
            </div>
          </div>
          {summaryLine ? <p className="text-sm text-muted-foreground">{strings.syncCompleted}: {summaryLine}</p> : null}
          {lastRunErrors.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3">
              {lastRunErrors.map((item) => (
                <p key={`${item.deviceId}:${item.errorCode ?? 'error'}`} className="text-sm text-destructive">
                  <span className="font-medium">{item.deviceId}</span>: {item.errorMessage ?? item.errorCode ?? strings.syncFailedTitle}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
      {actionMessage ? (
        <Alert>
          <AlertTitle>{strings.applyFailedTitle}</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      ) : null}

      <PersonsImportSummary summary={summary} statusLabels={strings.statusLabels} />

      <Card className="bg-card/70">
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle>{strings.terminalUsers}</CardTitle>
            <CardDescription>
              {strings.selectedDevices}: {selectedDeviceIds.length} · {strings.actionableOnly}: {actionableOnly ? 'on' : 'off'} · {selectedCount} selected
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <Button key={action} type="button" variant={action === 'skip' ? 'outline' : 'default'} disabled={applying || selectedCount === 0} onClick={() => void onApply(action)}>
                {strings.actionLabels[action]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as FilterTab)}>
            <TabsList variant="line">
              <TabsTrigger value="actionable">{strings.actionableOnly}</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="conflict">{strings.statusLabels.conflict}</TabsTrigger>
              <TabsTrigger value="missing_iin">{strings.statusLabels.missing_iin}</TabsTrigger>
              <TabsTrigger value="stale_terminal_record">{strings.statusLabels.stale_terminal_record}</TabsTrigger>
            </TabsList>
          </Tabs>
          <PersonsImportTable
            groups={loading ? [] : groups.filter((group) => !actionableOnly || isActionableStatus(group.status))}
            devices={devices}
            statusLabels={strings.statusLabels}
            strings={strings}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
        </CardContent>
      </Card>
    </div>
  )
}
