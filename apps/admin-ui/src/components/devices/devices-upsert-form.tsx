import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { DeviceAdapterItem, DeviceDirection, DeviceItem, DeviceUpdateInput, DeviceUpsertInput } from '@/lib/devices/types'
import {
  buildSettingsJsonFromDraft,
  createFieldDraft,
  parseDeviceSettingsSchema,
  parseSettingsJsonObject
} from './device-settings-schema'
import { DeviceSettingsFields } from './device-settings-fields'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type DevicesUpsertFormProps = {
  mode: 'create' | 'edit'
  initialDevice?: DeviceItem
  adapters: Array<DeviceAdapterItem>
  canWrite: boolean
  onSubmit: (input: DeviceUpsertInput | DeviceUpdateInput) => Promise<void>
  onClose: () => void
}

export function DevicesUpsertForm({
  mode,
  initialDevice,
  adapters,
  canWrite,
  onSubmit,
  onClose
}: DevicesUpsertFormProps) {
  const adapterVendorOptions = useMemo(
    () => Array.from(new Set(adapters.map((adapter) => adapter.vendorKey))),
    [adapters]
  )
  const [deviceId, setDeviceId] = useState(initialDevice?.deviceId ?? '')
  const [name, setName] = useState(initialDevice?.name ?? '')
  const [direction, setDirection] = useState<DeviceDirection>(initialDevice?.direction ?? 'IN')
  const [adapterKey, setAdapterKey] = useState(initialDevice?.adapterKey ?? adapterVendorOptions.at(0) ?? '')
  const [enabled, setEnabled] = useState(initialDevice?.enabled ?? true)
  const [settingsJson, setSettingsJson] = useState(initialDevice?.settingsJson ?? '')
  const [settingsDraft, setSettingsDraft] = useState<Record<string, unknown>>({})
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!canWrite || isSubmitting) {
      return false
    }
    if (!name.trim()) {
      return false
    }
    if (!adapterKey.trim() || adapterVendorOptions.length === 0) {
      return false
    }
    if (mode === 'create' && !deviceId.trim()) {
      return false
    }
    return true
  }, [adapterKey, adapterVendorOptions.length, canWrite, deviceId, isSubmitting, mode, name])

  const selectedVendor = useMemo(
    () => adapters.filter((adapter) => adapter.vendorKey === adapterKey),
    [adapterKey, adapters]
  )
  const selectedSchema = useMemo(
    () => selectedVendor.find((adapter) => adapter.deviceSettingsSchema)?.deviceSettingsSchema ?? null,
    [selectedVendor]
  )
  const settingsSchemaView = useMemo(
    () => parseDeviceSettingsSchema(selectedSchema),
    [selectedSchema]
  )

  useEffect(() => {
    if (!adapterKey && adapterVendorOptions.length > 0) {
      setAdapterKey(adapterVendorOptions[0] ?? '')
    }
  }, [adapterKey, adapterVendorOptions])

  useEffect(() => {
    if (!settingsSchemaView) {
      setSettingsDraft({})
      setSettingsErrors({})
      return
    }

    setSettingsDraft(createFieldDraft(settingsSchemaView, parseSettingsJsonObject(settingsJson)))
    setSettingsErrors({})
  }, [settingsJson, settingsSchemaView])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setError(null)
    setSettingsErrors({})
    setIsSubmitting(true)

    try {
      let resolvedSettingsJson: string | null = settingsJson.trim() ? settingsJson.trim() : null
      if (settingsSchemaView) {
        const built = buildSettingsJsonFromDraft(settingsSchemaView, settingsDraft)
        if (Object.keys(built.fieldErrors).length > 0) {
          setSettingsErrors(built.fieldErrors)
          setError('Check device settings fields and try again.')
          return
        }
        resolvedSettingsJson = built.settingsJson
      }

      if (mode === 'create') {
        const input: DeviceUpsertInput = {
          deviceId: deviceId.trim(),
          name: name.trim(),
          direction,
          adapterKey: adapterKey.trim(),
          enabled,
          settingsJson: resolvedSettingsJson
        }
        await onSubmit(input)
      } else {
        const input: DeviceUpdateInput = {
          name: name.trim(),
          direction,
          adapterKey: adapterKey.trim(),
          enabled,
          settingsJson: resolvedSettingsJson
        }
        await onSubmit(input)
      }
      onClose()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={handleSubmit}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {error ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Cannot save device</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="device-id">Device ID</Label>
          <Input
            id="device-id"
            value={deviceId}
            disabled={mode === 'edit' || isSubmitting}
            onChange={(event) => setDeviceId(event.target.value)}
            placeholder="door-1"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="device-name">Name</Label>
          <Input
            id="device-name"
            value={name}
            disabled={isSubmitting}
            onChange={(event) => setName(event.target.value)}
            placeholder="Main entry"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Direction</Label>
            <Select
              value={direction}
              onValueChange={(value) => setDirection(value as DeviceDirection)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Adapter</Label>
            <Select value={adapterKey} onValueChange={setAdapterKey} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={adapterVendorOptions.length > 0 ? 'Select adapter vendor' : 'No adapters registered'}
                />
              </SelectTrigger>
              <SelectContent>
                {adapterVendorOptions.map((vendorKey) => (
                  <SelectItem key={vendorKey} value={vendorKey}>
                    {vendorKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVendor.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Active instances: {selectedVendor.map((adapter) => adapter.instanceName).join(', ')}
              </p>
            ) : null}
            {adapterVendorOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No adapters found. Register adapter instance first in Device Operations.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="settings-json">Device settings</Label>
            {settingsSchemaView ? (
              <p className="text-xs text-muted-foreground">Schema-driven</p>
            ) : (
              <p className="text-xs text-muted-foreground">Raw JSON</p>
            )}
          </div>
          {settingsSchemaView ? (
            <DeviceSettingsFields
              schemaView={settingsSchemaView}
              settingsDraft={settingsDraft}
              settingsErrors={settingsErrors}
              isSubmitting={isSubmitting}
              onChangeDraft={setSettingsDraft}
            />
          ) : (
            <>
              <Input
                id="settings-json"
                value={settingsJson}
                disabled={isSubmitting}
                onChange={(event) => setSettingsJson(event.target.value)}
                placeholder='{"zone":"A"}'
              />
              <p className="text-xs text-muted-foreground">
                Adapter has no declared settings schema. Provide JSON manually.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
          <Label htmlFor="device-enabled" className="text-sm font-medium">Enabled</Label>
          <Switch
            id="device-enabled"
            checked={enabled}
            onCheckedChange={(value) => setEnabled(Boolean(value))}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create device' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}
