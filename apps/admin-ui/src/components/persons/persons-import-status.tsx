import type { PersonImportCandidateStatus } from '@/lib/persons/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PersonsImportStatusBadgeProps = {
  status: PersonImportCandidateStatus
  label: string
}

const STATUS_STYLES: Record<PersonImportCandidateStatus, string> = {
  ready_create: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-700',
  ready_link: 'border-sky-400/40 bg-sky-500/10 text-sky-700',
  already_linked: 'border-muted-foreground/30 text-muted-foreground',
  conflict: 'border-amber-400/40 bg-amber-500/10 text-amber-800',
  missing_iin: 'border-rose-400/40 bg-rose-500/10 text-rose-700',
  stale_terminal_record: 'border-slate-400/40 bg-slate-500/10 text-slate-700'
}

export function PersonsImportStatusBadge({
  status,
  label
}: PersonsImportStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', STATUS_STYLES[status])}>
      {label}
    </Badge>
  )
}
