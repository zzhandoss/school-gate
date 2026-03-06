import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { PersonTerminalPhotoPreviewDialog } from './person-terminal-photo-preview-dialog'
import type { PersonTerminalToolsStrings } from './person-terminal-tools-strings'
import { PersonTerminalSyncResultList } from './person-terminal-sync-result-list'
import type { DeviceItem } from '@/lib/devices/types'
import type { PersonIdentityItem, PersonTerminalSyncResult } from '@/lib/persons/types'

type PersonTerminalFaceDialogContentProps = {
  personId: string
  errorTitle: string
  error: string | null
  warnings: Array<string>
  strings: PersonTerminalToolsStrings
  loadingDraft: boolean
  linkedDevices: Array<DeviceItem>
  identities: Array<PersonIdentityItem>
  selectedDevices: Record<string, boolean>
  pending: boolean
  previewUrl: string
  result: PersonTerminalSyncResult | null
  onFileSelected: (file: File | null) => Promise<void>
  onToggleDevice: (deviceId: string, nextValue: boolean) => void
}

function formatDeviceLabel(device: DeviceItem, terminalPersonId?: string) {
  return `${device.name} (${device.deviceId})${terminalPersonId ? ` | ${terminalPersonId}` : ''}`
}

function replaceSummary(template: string, result: PersonTerminalSyncResult) {
  return template.replace('{{success}}', String(result.success)).replace('{{failed}}', String(result.failed))
}

export function PersonTerminalFaceDialogContent({
  personId,
  errorTitle,
  error,
  warnings,
  strings,
  loadingDraft,
  linkedDevices,
  identities,
  selectedDevices,
  pending,
  previewUrl,
  result,
  onFileSelected,
  onToggleDevice
}: PersonTerminalFaceDialogContentProps) {
  const linkedIdentityByDevice = new Map(identities.map((identity) => [identity.deviceId, identity]))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="space-y-5">
        {error ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

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

        <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 rounded-lg border border-border/70 bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{strings.faceSectionTitle}</h3>
              <p className="text-xs text-muted-foreground">{strings.faceSectionDescription}</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="terminal-face-upload">{previewUrl ? strings.replaceFace : strings.selectFaceLabel}</Label>
              <input
                id="terminal-face-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
                onChange={(event) => void onFileSelected(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">{strings.faceFileHint}</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-dashed border-border/70 bg-background/60">
              {previewUrl ? (
                <img src={previewUrl} alt={strings.facePreviewAlt} className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  {strings.noFaceSelected}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border/70 bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{strings.devicesSectionTitle}</h3>
              <p className="text-xs text-muted-foreground">{strings.faceDevicesDescription}</p>
            </div>

            {loadingDraft ? (
              <div className="rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground">
                {strings.loadingSnapshot}
              </div>
            ) : (
              <div className="space-y-2">
                {linkedDevices.map((device) => (
                  <div key={device.deviceId} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDeviceLabel(device, linkedIdentityByDevice.get(device.deviceId)?.terminalPersonId)}
                      </p>
                      {linkedIdentityByDevice.get(device.deviceId)?.terminalPersonId ? (
                        <PersonTerminalPhotoPreviewDialog
                          personId={personId}
                          device={device}
                          userId={linkedIdentityByDevice.get(device.deviceId)!.terminalPersonId}
                          triggerLabel={strings.facePreviewTitle}
                          previewTitle={strings.facePreviewTitle}
                          previewAlt={strings.facePreviewAlt}
                          loadingLabel={strings.loadingSnapshot}
                        />
                      ) : null}
                    </div>
                    <Switch
                      checked={Boolean(selectedDevices[device.deviceId])}
                      disabled={pending}
                      onCheckedChange={(value) => onToggleDevice(device.deviceId, Boolean(value))}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {result ? (
          <PersonTerminalSyncResultList
            devices={linkedDevices}
            identities={identities}
            result={result}
            title={strings.updateFace}
            summary={replaceSummary(strings.resultSummary, result)}
          />
        ) : null}
      </div>
    </div>
  )
}
