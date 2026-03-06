import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { DeviceItem } from '@/lib/devices/types'
import type { PersonsImportStrings } from './persons-import-strings'

type PersonsImportDevicePickerProps = {
  devices: Array<DeviceItem>
  selectedDeviceIds: Array<string>
  disabled?: boolean
  strings: PersonsImportStrings
  onToggleDevice: (deviceId: string) => void
  onToggleAllDevices: (checked: boolean) => void
}

export function getHeaderCheckboxState(selectedCount: number, totalCount: number) {
  if (totalCount === 0 || selectedCount === 0) {
    return false
  }
  if (selectedCount === totalCount) {
    return true
  }
  return 'indeterminate' as const
}

export function PersonsImportDevicePicker({
  devices,
  selectedDeviceIds,
  disabled = false,
  strings,
  onToggleDevice,
  onToggleAllDevices
}: PersonsImportDevicePickerProps) {
  if (devices.length === 0) {
    return null
  }

  const selectedCount = selectedDeviceIds.length
  const headerCheckboxState = getHeaderCheckboxState(selectedCount, devices.length)

  return (
    <div className="overflow-hidden rounded-lg border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox
                aria-label={strings.selectAllDevices}
                checked={headerCheckboxState}
                disabled={disabled}
                onChange={(event) => onToggleAllDevices(event.currentTarget.checked)}
              />
            </TableHead>
            <TableHead>{strings.deviceNameLabel}</TableHead>
            <TableHead>{strings.deviceIdLabel}</TableHead>
            <TableHead>{strings.adapterLabel}</TableHead>
            <TableHead>{strings.directionLabel}</TableHead>
            <TableHead>{strings.enabledLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const checked = selectedDeviceIds.includes(device.deviceId)
            return (
              <TableRow key={device.deviceId} data-state={checked ? 'selected' : undefined}>
                <TableCell className="w-12">
                  <Checkbox
                    aria-label={`${strings.selectDeviceLabel} ${device.name}`}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggleDevice(device.deviceId)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{device.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {strings.createdLabel}: {new Date(device.createdAt).toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{device.deviceId}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {device.adapterKey}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={device.direction === 'IN' ? 'secondary' : 'outline'}>
                    {device.direction}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={device.enabled ? 'secondary' : 'destructive'}>
                    {device.enabled ? strings.enabledValue : strings.disabledValue}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>{strings.selectedDevicesSummary.replace('{{selected}}', String(selectedCount)).replace('{{total}}', String(devices.length))}</span>
        <span>{strings.devices}</span>
      </div>
    </div>
  )
}
