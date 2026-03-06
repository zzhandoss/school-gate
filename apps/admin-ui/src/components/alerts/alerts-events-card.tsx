import { useTranslation } from 'react-i18next'

import { formatAlertDate, severityBadgeClass, statusBadgeClass } from './alerts-format'
import type { AlertEvent, AlertsPage } from '@/lib/alerts/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { DeviceListPagination } from '@/components/devices/device-list-pagination'

type AlertsEventsCardProps = {
  events: Array<AlertEvent>
  page: AlertsPage
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
}

export function AlertsEventsCard({
  events,
  page,
  loading = false,
  onPageChange,
  onPageSizeChange
}: AlertsEventsCardProps) {
  const { t } = useTranslation()
  const rangeStart = page.total === 0 ? 0 : page.offset + 1
  const rangeEnd = page.total === 0 ? 0 : Math.min(page.offset + events.length, page.total)
  const currentPage = Math.floor(page.offset / page.limit) + 1
  const totalPages = Math.max(1, Math.ceil(page.total / page.limit))

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>{t('alerts.recentEvents')}</CardTitle>
        <CardDescription>{t('alerts.recentEventsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.pagination.range', { from: rangeStart, to: rangeEnd, total: page.total })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('common.filters.pageSize')}</span>
            <Select
              value={String(page.limit)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[132px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('common.pagination.perPage', { count: 10 })}</SelectItem>
                <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('alerts.noRecentEvents')}
          </div>
        ) : (
          <div className="rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('common.labels.status')}</TableHead>
                  <TableHead>{t('alerts.table.severity')}</TableHead>
                  <TableHead>{t('alerts.table.message')}</TableHead>
                  <TableHead className="text-right">{t('alerts.table.createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(event.status)}>
                        {t(`alerts.status.${event.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityBadgeClass(event.severity)}>
                        {t(`alerts.severity.${event.severity}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground">{t('alerts.ruleId')}: {event.ruleId}</p>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatAlertDate(event.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DeviceListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          disabled={loading}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  )
}
