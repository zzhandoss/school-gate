import type { PersonItem } from '@/lib/persons/types'
import { Badge } from '@/components/ui/badge'

export type PersonBulkPreviewRow = {
  person: PersonItem
  linkedDeviceIds: Array<string>
  createDeviceIds: Array<string>
  skippedDeviceIds: Array<string>
}

type PersonsBulkTerminalCreatePreviewCardProps = {
  deviceLabels: Map<string, string>
  labels: {
    iin: string
    existingLinksTitle: string
    noLinkedDevices: string
    previewTitle: string
    createBadge: string
    skipBadge: string
    noTargetDevicesSelected: string
  }
  row: PersonBulkPreviewRow
}

function formatPersonName(person: PersonItem) {
  const value = [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
  return value || person.iin
}

export function PersonsBulkTerminalCreatePreviewCard({
  deviceLabels,
  labels,
  row
}: PersonsBulkTerminalCreatePreviewCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{formatPersonName(row.person)}</p>
          <p className="text-xs text-muted-foreground">{labels.iin}: {row.person.iin}</p>
        </div>
        <div className="flex gap-2">
          {row.createDeviceIds.length > 0 ? (
            <Badge className="rounded-full px-2.5 py-0.5">{labels.createBadge}: {row.createDeviceIds.length}</Badge>
          ) : null}
          {row.skippedDeviceIds.length > 0 ? (
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5">{labels.skipBadge}: {row.skippedDeviceIds.length}</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {labels.existingLinksTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {row.linkedDeviceIds.length > 0 ? row.linkedDeviceIds.map((deviceId) => (
              <Badge key={`${row.person.id}-${deviceId}-linked`} variant="secondary" className="rounded-full px-2.5 py-0.5">
                {deviceLabels.get(deviceId) ?? deviceId}
              </Badge>
            )) : (
              <span className="text-xs text-muted-foreground">{labels.noLinkedDevices}</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {labels.previewTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {row.createDeviceIds.map((deviceId) => (
              <Badge key={`${row.person.id}-${deviceId}-create`} className="rounded-full px-2.5 py-0.5">
                {labels.createBadge}: {deviceLabels.get(deviceId) ?? deviceId}
              </Badge>
            ))}
            {row.skippedDeviceIds.map((deviceId) => (
              <Badge key={`${row.person.id}-${deviceId}-skip`} variant="outline" className="rounded-full px-2.5 py-0.5">
                {labels.skipBadge}: {deviceLabels.get(deviceId) ?? deviceId}
              </Badge>
            ))}
            {row.createDeviceIds.length === 0 && row.skippedDeviceIds.length === 0 ? (
              <span className="text-xs text-muted-foreground">{labels.noTargetDevicesSelected}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
