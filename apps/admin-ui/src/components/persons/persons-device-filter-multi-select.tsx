import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { DeviceItem } from '@/lib/devices/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type PersonsDeviceFilterMultiSelectProps = {
  devices: Array<DeviceItem>
  value: Array<string>
  placeholder: string
  disabled?: boolean
  onChange: (value: Array<string>) => void
}

export function PersonsDeviceFilterMultiSelect({
  devices,
  value,
  placeholder,
  disabled = false,
  onChange
}: PersonsDeviceFilterMultiSelectProps) {
  const { t } = useTranslation()
  const sortedDevices = useMemo(
    () => [...devices].sort((left, right) => left.name.localeCompare(right.name)),
    [devices]
  )
  const selectedDevices = useMemo(
    () => sortedDevices.filter((device) => value.includes(device.deviceId)),
    [sortedDevices, value]
  )
  const summaryLabel = selectedDevices[0]?.name ?? null

  function toggleDevice(deviceId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...value, deviceId]))
      : value.filter((item) => item !== deviceId)
    onChange(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-auto min-h-11 w-full justify-between gap-3 rounded-xl bg-background/80 px-3 py-2"
        >
          <div className="min-w-0 flex-1 text-left">
            {selectedDevices.length === 0 ? (
              <span className="truncate text-sm text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{summaryLabel}</span>
                {selectedDevices.length > 1 ? (
                  <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0.5">
                    +{selectedDevices.length - 1}
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0">{placeholder}</DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('h-7 px-2 text-xs', value.length === 0 && 'invisible')}
            disabled={value.length === 0}
            onClick={() => onChange([])}
          >
            <X className="h-3.5 w-3.5" />
            {t('persons.filters.clearSelection')}
          </Button>
        </div>
        <DropdownMenuSeparator />
        {sortedDevices.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            {t('persons.bulkTerminalCreate.noDevices')}
          </div>
        ) : (
          sortedDevices.map((device) => {
            const checked = value.includes(device.deviceId)
            return (
              <DropdownMenuCheckboxItem
                key={device.deviceId}
                checked={checked}
                className="items-start py-2"
                onCheckedChange={(nextChecked) => toggleDevice(device.deviceId, Boolean(nextChecked))}
                onSelect={(event) => event.preventDefault()}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{device.name}</span>
                    {checked ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {device.deviceId} | {device.adapterKey}
                  </div>
                </div>
              </DropdownMenuCheckboxItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
