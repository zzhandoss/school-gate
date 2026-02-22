import type { AuditLogItem } from '@/lib/audit-logs/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AuditLogsTableProps = {
  logs: Array<AuditLogItem>
  loading: boolean
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('en-GB', { hour12: false })
}

function summarizeMeta(meta: Record<string, unknown> | null) {
  if (!meta) {
    return '—'
  }

  const keys = Object.keys(meta)
  if (keys.length === 0) {
    return '{}'
  }

  const preview = keys.slice(0, 2).join(', ')
  return keys.length > 2 ? `${preview} +${keys.length - 2}` : preview
}

export function AuditLogsTable({ logs, loading }: AuditLogsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">At</TableHead>
            <TableHead className="w-[140px]">Actor</TableHead>
            <TableHead className="w-[220px]">Action</TableHead>
            <TableHead className="w-[240px]">Entity</TableHead>
            <TableHead className="w-[200px]">Meta</TableHead>
            <TableHead className="w-[220px]">Event ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No audit logs found for current filters.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">{formatDateTime(log.at)}</TableCell>
                <TableCell className="font-mono text-xs">{log.actorId}</TableCell>
                <TableCell className="truncate text-xs">{log.action}</TableCell>
                <TableCell className="text-xs">
                  <span className="font-mono">{log.entityType}</span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className="font-mono">{log.entityId}</span>
                </TableCell>
                <TableCell className="text-xs">
                  {log.meta ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="cursor-help rounded-md border border-border/60 px-2 py-0.5 font-mono text-xs hover:bg-muted"
                        >
                          {summarizeMeta(log.meta)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[360px]">
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{log.eventId ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
