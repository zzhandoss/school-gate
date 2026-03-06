import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { PersonTerminalSyncResult } from '@/lib/persons/types'

type PersonTerminalSyncSummaryProps = {
  title: string
  summaryTemplate: string
  result: PersonTerminalSyncResult
}

function replaceSummary(template: string, result: PersonTerminalSyncResult) {
  return template.replace('{{success}}', String(result.success)).replace('{{failed}}', String(result.failed))
}

export function PersonTerminalSyncSummary({ title, summaryTemplate, result }: PersonTerminalSyncSummaryProps) {
  return (
    <Alert className="mt-4">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{replaceSummary(summaryTemplate, result)}</AlertDescription>
    </Alert>
  )
}
