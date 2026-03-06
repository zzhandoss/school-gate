import { useMemo } from 'react'

import type { DeviceItem } from '@/lib/devices/types'
import type { PersonIdentityItem, PersonTerminalSyncResult } from '@/lib/persons/types'
import { Badge } from '@/components/ui/badge'

type PersonTerminalSyncResultListProps = {
  devices: Array<DeviceItem>
  identities: Array<PersonIdentityItem>
  result: PersonTerminalSyncResult
  title: string
  summary: string
}

function formatDeviceLabel(deviceName: string, deviceId: string, terminalPersonId?: string) {
  return `${deviceName} (${deviceId})${terminalPersonId ? ` | ${terminalPersonId}` : ''}`
}

function formatStepLabel(label: string, status: 'success' | 'failed' | 'skipped') {
  return `${label}: ${status}`
}

export function PersonTerminalSyncResultList({ devices, identities, result, title, summary }: PersonTerminalSyncResultListProps) {
  const deviceMap = useMemo(() => new Map(devices.map((device) => [device.deviceId, device])), [devices])
  const identityMap = useMemo(() => new Map(identities.map((identity) => [identity.deviceId, identity])), [identities])

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-card/60 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </div>

      <div className="space-y-2">
        {result.results.map((item) => {
          const device = deviceMap.get(item.deviceId)
          const identity = identityMap.get(item.deviceId)
          const toneClassName = item.status === 'success'
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-destructive/40 bg-destructive/5'

          return (
            <div key={item.deviceId} className={`space-y-2 rounded-md border px-3 py-3 ${toneClassName}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{device?.name ?? item.deviceId}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDeviceLabel(device?.name ?? item.deviceId, item.deviceId, identity?.terminalPersonId)}
                  </p>
                </div>
                <Badge variant={item.status === 'success' ? 'secondary' : 'destructive'}>{item.status}</Badge>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{formatStepLabel('user', item.steps.accessUser)}</span>
                <span>{formatStepLabel('card', item.steps.accessCard)}</span>
                <span>{formatStepLabel('face', item.steps.accessFace)}</span>
              </div>

              {item.errorMessage ? (
                <p className="text-xs text-destructive">{item.errorMessage}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
