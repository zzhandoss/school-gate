import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      setActionError(value instanceof Error ? value.message : t('devices.cannotUpdateState'))
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
      setActionError(value instanceof Error ? value.message : t('devices.cannotDeleteDevice'))
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
            <TableHead>{t('common.labels.device')}</TableHead>
            <TableHead>{t('common.labels.adapter')}</TableHead>
            <TableHead>{t('common.labels.direction')}</TableHead>
            <TableHead>{t('common.labels.status')}</TableHead>
            <TableHead>{t('devices.updated')}</TableHead>
            <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {t('devices.noDevicesRegistered')}
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
                          : t('devices.noActiveAdapterInstances')}
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
                        aria-label={t('devices.toggleAria', { name: device.name })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {device.enabled ? t('devices.enabled') : t('settings.disabled')}
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
                            {isDeleting ? t('persons.deleting') : t('devices.confirm')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            {t('common.actions.cancel')}
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
                          {t('persons.delete')}
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
