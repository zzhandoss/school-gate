import type { MonitoringSnapshot } from '@/lib/dashboard/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/i18n/format'

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

function workerStatusBadgeVariant(status: 'ok' | 'stale') {
  return status === 'ok' ? 'default' : 'outline'
}

function componentStatusBadgeVariant(_: 'ok' | 'down'): 'outline' {
  return 'outline'
}

function componentStatusBadgeClass(status: 'ok' | 'down') {
  if (status === 'ok') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200'
  }
  return 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200'
}

function workerStatusLabel(t: TranslateFn, status: 'ok' | 'stale') {
  return status === 'ok' ? t('enums.monitoringStatus.ok') : t('enums.monitoringStatus.stale')
}

function componentStatusLabel(t: TranslateFn, status: 'ok' | 'down') {
  return status === 'ok' ? t('enums.monitoringStatus.ok') : t('enums.monitoringStatus.down')
}

function sortedEntries(source: Record<string, number>) {
  return Object.entries(source).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
}

type MonitoringWorkersCardProps = {
  snapshot: MonitoringSnapshot
  t: TranslateFn
}

export function MonitoringWorkersCard({ snapshot, t }: MonitoringWorkersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.workerHealth')}</CardTitle>
        <CardDescription>{t('dashboard.workersTracked', { count: snapshot.workers.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <caption className="sr-only">{t('monitoring.workersTableCaption')}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t('monitoring.worker')}</TableHead>
              <TableHead>{t('common.labels.status')}</TableHead>
              <TableHead>{t('common.labels.lastSeen')}</TableHead>
              <TableHead>{t('monitoring.lastError')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.workers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t('common.empty.noMatches')}
                </TableCell>
              </TableRow>
            ) : (
              snapshot.workers.map((item) => (
                <TableRow key={item.workerId}>
                  <TableCell className="font-medium">{item.workerId}</TableCell>
                  <TableCell>
                    <Badge variant={workerStatusBadgeVariant(item.status)}>
                      {workerStatusLabel(t, item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDateTime(item.updatedAt, '-')}</TableCell>
                  <TableCell className="max-w-52 truncate text-muted-foreground">
                    {item.lastErrorAt ? `${formatDateTime(item.lastErrorAt, '-')}: ${item.lastError ?? '-'}` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type MonitoringComponentsCardProps = {
  snapshot: MonitoringSnapshot
  t: TranslateFn
}

export function MonitoringComponentsCard({ snapshot, t }: MonitoringComponentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.componentStatus')}</CardTitle>
        <CardDescription>{t('dashboard.totalComponents', { count: snapshot.components.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <caption className="sr-only">{t('monitoring.componentsTableCaption')}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t('monitoring.component')}</TableHead>
              <TableHead>{t('common.labels.status')}</TableHead>
              <TableHead>{t('monitoring.checked')}</TableHead>
              <TableHead>{t('monitoring.error')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t('common.empty.noMatches')}
                </TableCell>
              </TableRow>
            ) : (
              snapshot.components.map((item) => (
                <TableRow key={item.componentId}>
                  <TableCell className="font-medium">{item.componentId}</TableCell>
                  <TableCell>
                    <Badge variant={componentStatusBadgeVariant(item.status)} className={componentStatusBadgeClass(item.status)}>
                      {componentStatusLabel(t, item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDateTime(item.checkedAt, '-')}</TableCell>
                  <TableCell className="max-w-52 truncate text-muted-foreground">{item.error ?? '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type MonitoringQueueBreakdownCardProps = {
  title: string
  description: string
  counts: Record<string, number>
  emptyLabel: string
}

export function MonitoringQueueBreakdownCard({
  title,
  description,
  counts,
  emptyLabel
}: MonitoringQueueBreakdownCardProps) {
  const entries = sortedEntries(counts)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-border/70 bg-background/70 px-3 py-2">
              <span className="text-sm text-muted-foreground">{key}</span>
              <span className="text-sm font-semibold tabular-nums">{value}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
