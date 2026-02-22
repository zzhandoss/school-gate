import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Clock3, IdCard, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AccessEventsMapPanel } from './access-events-map-panel'
import { formatDateTime } from './access-events-format'
import type { AccessEventItem, UnmatchedAccessEventItem } from '@/lib/access-events/types'
import {
  accessEventStatusLabel,
  directionLabel
} from '@/lib/i18n/enum-labels'
import { PersonHoverCard } from '@/components/persons/person-hover-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

type AccessEventsTableProps = {
  events: Array<AccessEventItem>
  loading?: boolean
  canMap: boolean
  onMapped: () => Promise<void>
}

function HeaderWithTooltip(input: { short: string; full: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center">{input.short}</span>
      </TooltipTrigger>
      <TooltipContent>{input.full}</TooltipContent>
    </Tooltip>
  )
}

function personLabel(event: AccessEventItem) {
  if (!event.person) {
    return event.terminalPersonId ?? '-'
  }
  const fullName = [event.person.firstName, event.person.lastName].filter(Boolean).join(' ').trim()
  return fullName || event.person.iin
}

function statusBadgeClassName(status: AccessEventItem["status"]) {
  switch (status) {
    case "PROCESSED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
    case "UNMATCHED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700"
    case "ERROR":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    case "FAILED_RETRY":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700"
    case "PROCESSING":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700"
    case "NEW":
      return "border-muted-foreground/25 bg-muted text-muted-foreground"
    default:
      return ""
  }
}

export function AccessEventsTable({ events, loading = false, canMap, onMapped }: AccessEventsTableProps) {
  const { t } = useTranslation()
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const bottomScrollRef = useRef<HTMLDivElement | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)
  const syncLockRef = useRef<null | 'top' | 'bottom'>(null)
  const [tableWidth, setTableWidth] = useState(0)

  useEffect(() => {
    if (!tableRef.current) {
      return
    }

    const updateWidth = () => {
      setTableWidth(tableRef.current?.scrollWidth ?? 0)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(tableRef.current)
    return () => observer.disconnect()
  }, [events, loading])

  const onTopScroll = () => {
    if (syncLockRef.current === 'bottom') {
      syncLockRef.current = null
      return
    }

    if (!topScrollRef.current || !bottomScrollRef.current) {
      return
    }

    syncLockRef.current = 'top'
    bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
  }

  const onBottomScroll = () => {
    if (syncLockRef.current === 'top') {
      syncLockRef.current = null
      return
    }

    if (!topScrollRef.current || !bottomScrollRef.current) {
      return
    }

    syncLockRef.current = 'bottom'
    topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        {t('accessEvents.noEventsForFilters')}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div
        ref={topScrollRef}
        onScroll={onTopScroll}
        className="mb-1 w-full overflow-x-auto overflow-y-hidden"
      >
        <div style={{ width: tableWidth, height: 1 }} />
      </div>
      <div
        ref={bottomScrollRef}
        onScroll={onBottomScroll}
        className="relative w-full overflow-auto"
      >
      <table ref={tableRef} className="w-full table-fixed caption-bottom text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[210px]">{t('accessEvents.occurredAt')}</TableHead>
            <TableHead className="w-[122px]">{t('common.labels.device')}</TableHead>
            <TableHead className="w-[70px]"><HeaderWithTooltip short={t('accessEvents.dirShort')} full={t('common.labels.direction')} /></TableHead>
            <TableHead className="w-[165px]">{t('accessEvents.person')}</TableHead>
            <TableHead className="w-[118px]">{t('common.labels.status')}</TableHead>
            <TableHead className="w-[78px] text-right">{t('accessEvents.action')}</TableHead>
            <TableHead className="w-[92px] text-center">
              <HeaderWithTooltip short={t('accessEvents.diagShort')} full={t('accessEvents.diagnostics')} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDateTime(event.occurredAt)}
                </span>
              </TableCell>

              <TableCell className="max-w-[122px] truncate font-medium" title={event.deviceId}>
                {event.deviceId}
              </TableCell>

              <TableCell>
                <Badge className="px-2 py-0 text-[10px]" variant={event.direction === 'IN' ? 'default' : 'outline'}>
                  {directionLabel(t, event.direction)}
                </Badge>
              </TableCell>

              <TableCell className="max-w-[165px] truncate text-muted-foreground">
                {event.person ? (
                  <PersonHoverCard
                    person={{
                      id: event.person.id,
                      iin: event.person.iin,
                      firstName: event.person.firstName,
                      lastName: event.person.lastName,
                      terminalPersonId: event.terminalPersonId
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex max-w-full cursor-help items-center gap-1.5 truncate text-left text-foreground hover:text-primary"
                    >
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{personLabel(event)}</span>
                    </button>
                  </PersonHoverCard>
                ) : (
                  <span title={event.terminalPersonId ?? '-'}>{event.terminalPersonId ?? '-'}</span>
                )}
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className={`px-2 py-0 text-[10px] ${statusBadgeClassName(event.status)}`}
                >
                  {accessEventStatusLabel(t, event.status)}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                {event.status === 'UNMATCHED' ? (
                  <AccessEventsMapPanel event={event as UnmatchedAccessEventItem} canMap={canMap} onMapped={onMapped} />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground">
                        <IdCard className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t('accessEvents.mappingOnlyForUnmatched')}</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>

              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={t('accessEvents.diagnosticsForEventAria', { eventId: event.id })}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="space-y-1">
                    <p>{t('accessEvents.attempts')}: {event.attempts}</p>
                    <p>{t('accessEvents.error')}: {event.lastError ?? t('accessEvents.none')}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
      </div>
    </TooltipProvider>
  )
}
