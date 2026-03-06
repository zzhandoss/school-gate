import { Sparkles, WandSparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { PersonTerminalWriteDraft } from './person-terminal-write-form.helpers'
import { getPersonTerminalToolsStrings } from './person-terminal-tools-strings'
import type { DeviceItem } from '@/lib/devices/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

type PersonTerminalWriteFormProps = {
  mode: 'create' | 'update'
  draft: PersonTerminalWriteDraft
  devices: Array<DeviceItem>
  selectedDevices: Record<string, boolean>
  warnings: Array<string>
  loading: boolean
  pending: boolean
  onDraftChange: (patch: Partial<PersonTerminalWriteDraft>) => void
  onUseIin: () => void
  onToggleDevice: (deviceId: string, nextValue: boolean) => void
}

function buildDeviceLabel(device: DeviceItem) {
  return `${device.name} (${device.deviceId})`
}

export function PersonTerminalWriteForm({
  mode,
  draft,
  devices,
  selectedDevices,
  warnings,
  loading,
  pending,
  onDraftChange,
  onUseIin,
  onToggleDevice
}: PersonTerminalWriteFormProps) {
  const { i18n } = useTranslation()
  const strings = getPersonTerminalToolsStrings(i18n.language)

  return (
    <div className="space-y-5">
      {warnings.length > 0 ? (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100">
          <AlertTitle>{strings.snapshotWarningTitle}</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{strings.terminalUserSectionTitle}</h3>
          <p className="text-xs text-muted-foreground">{strings.terminalUserSectionDescription}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${mode}-terminal-user-id`}>{strings.terminalPersonIdLabel}</Label>
              {mode === 'create' ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onUseIin}>
                  <WandSparkles className="h-3.5 w-3.5" />
                  {strings.useIin}
                </Button>
              ) : null}
            </div>
            <Input
              id={`${mode}-terminal-user-id`}
              value={draft.terminalPersonId}
              onChange={(event) => onDraftChange({ terminalPersonId: event.target.value })}
              placeholder="100013"
            />
            <p className="text-xs text-muted-foreground">{strings.terminalPersonIdHint}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${mode}-display-name`}>{strings.displayNameLabel}</Label>
            <Input
              id={`${mode}-display-name`}
              value={draft.displayName}
              onChange={(event) => onDraftChange({ displayName: event.target.value })}
              placeholder="Ivan Petrov"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${mode}-citizen-id`}>{strings.citizenIdNoLabel}</Label>
            <Input
              id={`${mode}-citizen-id`}
              value={draft.citizenIdNo}
              onChange={(event) => onDraftChange({ citizenIdNo: event.target.value })}
              placeholder="900101000001"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-3 md:col-span-2">
            <div className="grid gap-2">
              <Label htmlFor={`${mode}-user-type`}>{strings.userTypeLabel}</Label>
              <Select value={draft.userType} onValueChange={(value) => onDraftChange({ userType: value })}>
                <SelectTrigger id={`${mode}-user-type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${mode}-user-status`}>{strings.userStatusLabel}</Label>
              <Select value={draft.userStatus} onValueChange={(value) => onDraftChange({ userStatus: value })}>
                <SelectTrigger id={`${mode}-user-status`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${mode}-authority`}>{strings.authorityLabel}</Label>
              <Select value={draft.authority} onValueChange={(value) => onDraftChange({ authority: value })}>
                <SelectTrigger id={`${mode}-authority`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{strings.validitySectionTitle}</h3>
          <p className="text-xs text-muted-foreground">{strings.validitySectionDescription}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-valid-from`}>{strings.validFromLabel}</Label>
            <Input
              id={`${mode}-valid-from`}
              type="datetime-local"
              value={draft.validFrom}
              onChange={(event) => onDraftChange({ validFrom: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-valid-to`}>{strings.validToLabel}</Label>
            <Input
              id={`${mode}-valid-to`}
              type="datetime-local"
              value={draft.validTo}
              onChange={(event) => onDraftChange({ validTo: event.target.value })}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{strings.cardSectionTitle}</h3>
          <p className="text-xs text-muted-foreground">{strings.cardSectionDescription}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-card-no`}>{strings.cardNoLabel}</Label>
            <Input
              id={`${mode}-card-no`}
              value={draft.cardNo}
              onChange={(event) => onDraftChange({ cardNo: event.target.value })}
              placeholder="CARD-100013"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-card-name`}>{strings.cardNameLabel}</Label>
            <Input
              id={`${mode}-card-name`}
              value={draft.cardName}
              onChange={(event) => onDraftChange({ cardName: event.target.value })}
              placeholder={strings.cardNamePlaceholder}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-card-type`}>{strings.cardTypeLabel}</Label>
            <Select value={draft.cardType} onValueChange={(value) => onDraftChange({ cardType: value })}>
              <SelectTrigger id={`${mode}-card-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-card-status`}>{strings.cardStatusLabel}</Label>
            <Select value={draft.cardStatus} onValueChange={(value) => onDraftChange({ cardStatus: value })}>
              <SelectTrigger id={`${mode}-card-status`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{strings.devicesSectionTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {mode === 'create' ? strings.devicesSectionCreateDescription : strings.devicesSectionUpdateDescription}
            </p>
          </div>
          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {strings.loadingSnapshot}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 p-3">
          {devices.map((device) => (
            <div key={device.deviceId} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">{device.name}</p>
                <p className="text-xs text-muted-foreground">{buildDeviceLabel(device)}</p>
              </div>
              <Switch
                checked={Boolean(selectedDevices[device.deviceId])}
                disabled={pending || mode === 'update'}
                onCheckedChange={(value) => onToggleDevice(device.deviceId, Boolean(value))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
