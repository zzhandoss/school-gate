import { formatAlertDate, severityBadgeClass, statusBadgeClass } from './alerts-format'
import type { AlertEvent } from '@/lib/alerts/types'
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

type AlertsEventsCardProps = {
  events: Array<AlertEvent>
}

export function AlertsEventsCard({ events }: AlertsEventsCardProps) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>Recent events</CardTitle>
        <CardDescription>Latest alert transitions from monitoring snapshots.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            No alert events in recent snapshots.
          </div>
        ) : (
          <div className="rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Created at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityBadgeClass(event.severity)}>
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground">Rule ID: {event.ruleId}</p>
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
      </CardContent>
    </Card>
  )
}
