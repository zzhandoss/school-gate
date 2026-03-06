import type { PersonImportCandidateStatus } from '@/lib/persons/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PersonsImportSummaryProps = {
  summary: Record<PersonImportCandidateStatus, number>
  statusLabels: Record<PersonImportCandidateStatus, string>
}

const STATUS_ORDER: Array<PersonImportCandidateStatus> = [
  'ready_create',
  'ready_link',
  'conflict',
  'missing_iin',
  'stale_terminal_record',
  'already_linked'
]

export function PersonsImportSummary({
  summary,
  statusLabels
}: PersonsImportSummaryProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {STATUS_ORDER.map((status) => (
        <Card key={status} className="bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {statusLabels[status]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary[status]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
