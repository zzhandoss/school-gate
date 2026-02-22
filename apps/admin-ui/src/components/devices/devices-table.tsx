import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { DevicesUpsertPanel } from './devices-upsert-panel'
import { formatDateTime } from './device-ops-format'
import type { DeviceAdapterItem, DeviceItem, DeviceUpdateInput } from '@/lib/devices/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type DevicesTableProps = {
  devices: Array<DeviceItem>
  adapters: Array<DeviceAdapterItem>
  canWrite: boolean
  onUpdate: (deviceId: string, input: DeviceUpdateInput) => Promise<void>
  onToggleEnabled: (deviceId: string, enabled: boolean) => Promise<void>
  onDelete: (deviceId: string) => Promise<void>
}

export function DevicesTable({
  devices,
  adapters,
  canWrite,
  onUpdate,
  onToggleEnabled,
  onDelete
}: DevicesTableProps) {
  const adaptersByVendor = new Map<string, Array<DeviceAdapterItem>>()
  for (const adapter of adapters) {
    const group = adaptersByVendor.get(adapter.vendorKey)
    if (!group) {
      adaptersByVendor.set(adapter.vendorKey, [adapter])
    } else {
      group.push(adapter)
    }
  }

  const [updatingEnabledId, setUpdatingEnabledId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleToggle(device: DeviceItem, nextEnabled: boolean) {
    if (!canWrite) {
      return
    }

    setActionError(null)
    setUpdatingEnabledId(device.deviceId)
    try {
      await onToggleEnabled(device.deviceId, nextEnabled)
    } catch (value) {
      setActionError(value instanceof Error ? value.message : 'Cannot update device state')
    } finally {
      setUpdatingEnabledId(null)
    }
  }

  async function handleDelete(deviceId: string) {
    if (!canWrite) {
      return
    }

    setActionError(null)
    setDeletingId(deviceId)
    try {
      await onDelete(deviceId)
      setConfirmDeleteId(null)
    } catch (value) {
      setActionError(value instanceof Error ? value.message : 'Cannot delete device')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {actionError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Adapter</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No devices registered yet.
              </TableCell>
            </TableRow>
          ) : (
            devices.map((device) => {
              const isConfirmingDelete = confirmDeleteId === device.deviceId
              const isDeleting = deletingId === device.deviceId
              const adapterGroup = adaptersByVendor.get(device.adapterKey) ?? []
              return (
                <TableRow key={device.deviceId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{device.adapterKey}</p>
                      <p className="text-xs text-muted-foreground">
                        {adapterGroup.length > 0
                          ? adapterGroup.map((adapter) => adapter.instanceName).join(', ')
                          : 'No active adapter instances'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.direction}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={device.enabled}
                        disabled={!canWrite || updatingEnabledId === device.deviceId}
                        onCheckedChange={(value) => void handleToggle(device, Boolean(value))}
                        aria-label={`Toggle ${device.name}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {device.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(device.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DevicesUpsertPanel
                        mode="edit"
                        device={device}
                        adapters={adapters}
                        canWrite={canWrite}
                        onSubmit={async (input) => onUpdate(device.deviceId, input as DeviceUpdateInput)}
                      />
                      {isConfirmingDelete ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={!canWrite || isDeleting}
                            onClick={() => void handleDelete(device.deviceId)}
                          >
                            {isDeleting ? 'Deleting...' : 'Confirm'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={!canWrite}
                          onClick={() => setConfirmDeleteId(device.deviceId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
