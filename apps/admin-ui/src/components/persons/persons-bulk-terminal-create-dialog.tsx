import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { createDefaultTerminalValidityWindow } from './person-terminal-write-form.helpers'
import { PersonsBulkTerminalCreatePreviewCard } from './persons-bulk-terminal-create-preview-card'
import type { PersonBulkPreviewRow } from './persons-bulk-terminal-create-preview-card'
import type { PersonIdentityItem, PersonItem } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import { listPersonIdentities } from '@/lib/persons/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PersonsBulkTerminalCreateDialogProps = {
  open: boolean
  pending: boolean
  persons: Array<PersonItem>
  devices: Array<DeviceItem>
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { personIds: Array<string>; deviceIds: Array<string>; validFrom: string; validTo: string }) => void
}

export function PersonsBulkTerminalCreateDialog({
  open,
  pending,
  persons,
  devices,
  error,
  onOpenChange,
  onSubmit
}: PersonsBulkTerminalCreateDialogProps) {
  const { t } = useTranslation()
  const enabledDevices = useMemo(() => devices.filter((device) => device.enabled), [devices])
  const deviceLabels = useMemo(
    () => new Map(enabledDevices.map((device) => [device.deviceId, `${device.name} (${device.deviceId})`])),
    [enabledDevices]
  )
  const [selectedDevices, setSelectedDevices] = useState<Record<string, boolean>>({})
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [linkedIdentitiesByPersonId, setLinkedIdentitiesByPersonId] = useState<Record<string, Array<PersonIdentityItem>>>({})
  const [loadingLinkedIdentities, setLoadingLinkedIdentities] = useState(false)
  const [linkedIdentitiesError, setLinkedIdentitiesError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const defaults = createDefaultTerminalValidityWindow()
    setValidFrom(defaults.validFrom)
    setValidTo(defaults.validTo)
    setSelectedDevices(Object.fromEntries(enabledDevices.map((device) => [device.deviceId, false])))
  }, [enabledDevices, open])

  useEffect(() => {
    if (!open || persons.length === 0) {
      return
    }

    let active = true
    setLoadingLinkedIdentities(true)
    setLinkedIdentitiesError(null)

    async function loadLinkedIdentities() {
      try {
        const entries = await Promise.all(
          persons.map(async (person) => [person.id, await listPersonIdentities(person.id)] as const)
        )
        if (active) {
          setLinkedIdentitiesByPersonId(Object.fromEntries(entries))
        }
      } catch (value) {
        if (active) {
          setLinkedIdentitiesError(value instanceof Error ? value.message : t('persons.bulkTerminalCreate.previewLoadFailed'))
        }
      } finally {
        if (active) {
          setLoadingLinkedIdentities(false)
        }
      }
    }

    void loadLinkedIdentities()

    return () => {
      active = false
    }
  }, [open, persons, t])

  const selectedDeviceIds = useMemo(
    () => Object.entries(selectedDevices).filter(([, checked]) => checked).map(([deviceId]) => deviceId),
    [selectedDevices]
  )
  const previewRows = useMemo<Array<PersonBulkPreviewRow>>(
    () => persons.map((person) => {
      const linkedDeviceIds = Array.from(
        new Set((linkedIdentitiesByPersonId[person.id] ?? []).map((identity) => identity.deviceId))
      )
      const linkedDeviceIdSet = new Set(linkedDeviceIds)

      return {
        person,
        linkedDeviceIds,
        createDeviceIds: selectedDeviceIds.filter((deviceId) => !linkedDeviceIdSet.has(deviceId)),
        skippedDeviceIds: selectedDeviceIds.filter((deviceId) => linkedDeviceIdSet.has(deviceId))
      }
    }),
    [linkedIdentitiesByPersonId, persons, selectedDeviceIds]
  )
  const createPairsCount = useMemo(
    () => previewRows.reduce((sum, row) => sum + row.createDeviceIds.length, 0),
    [previewRows]
  )
  const skippedPairsCount = useMemo(
    () => previewRows.reduce((sum, row) => sum + row.skippedDeviceIds.length, 0),
    [previewRows]
  )
  const canSubmit =
    persons.length > 0 &&
    selectedDeviceIds.length > 0 &&
    validFrom.trim().length > 0 &&
    validTo.trim().length > 0 &&
    createPairsCount > 0 &&
    !loadingLinkedIdentities

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!pending) {
        onOpenChange(nextOpen)
      }
    }}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('persons.bulkTerminalCreate.title')}</DialogTitle>
          <DialogDescription>{t('persons.bulkTerminalCreate.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{t('persons.bulkTerminalCreate.datesTitle')}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t('persons.bulkTerminalCreate.defaultsHint')}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="bulk-terminal-valid-from">{t('persons.bulkTerminalCreate.validFrom')}</Label>
                  <Input id="bulk-terminal-valid-from" type="datetime-local" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulk-terminal-valid-to">{t('persons.bulkTerminalCreate.validTo')}</Label>
                  <Input id="bulk-terminal-valid-to" type="datetime-local" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{t('persons.bulkTerminalCreate.devicesTitle')}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('persons.bulkTerminalCreate.summaryDescription', {
                  persons: persons.length,
                  devices: selectedDeviceIds.length
                })}
              </p>
              <div className="mt-4 space-y-2">
                {enabledDevices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('persons.bulkTerminalCreate.noDevices')}</p>
                ) : enabledDevices.map((device) => (
                  <label key={device.deviceId} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3 transition-colors hover:border-border">
                    <Checkbox
                      checked={selectedDevices[device.deviceId] ?? false}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked
                        setSelectedDevices((current) => ({ ...current, [device.deviceId]: checked }))
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.deviceId} | {device.adapterKey}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{t('persons.bulkTerminalCreate.summaryTitle')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('persons.bulkTerminalCreate.summaryDescription', {
                      persons: persons.length,
                      devices: selectedDeviceIds.length
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full px-2.5 py-0.5">{t('persons.bulkTerminalCreate.createPairsSummary', { count: createPairsCount })}</Badge>
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5">{t('persons.bulkTerminalCreate.skipPairsSummary', { count: skippedPairsCount })}</Badge>
                </div>
              </div>
              {selectedDeviceIds.length > 0 && createPairsCount === 0 && !loadingLinkedIdentities ? (
                <p className="mt-3 text-sm text-muted-foreground">{t('persons.bulkTerminalCreate.allPairsAlreadyLinked')}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">{t('persons.bulkTerminalCreate.personsTitle', { count: persons.length })}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('persons.bulkTerminalCreate.previewTitle')}</p>
              <div className="mt-4 space-y-3">
                {loadingLinkedIdentities ? (
                  <p className="text-sm text-muted-foreground">{t('persons.bulkTerminalCreate.loadingPreview')}</p>
                ) : previewRows.map((row) => (
                  <PersonsBulkTerminalCreatePreviewCard
                    key={row.person.id}
                    row={row}
                    deviceLabels={deviceLabels}
                    labels={{
                      iin: t('common.labels.iin'),
                      existingLinksTitle: t('persons.bulkTerminalCreate.existingLinksTitle'),
                      noLinkedDevices: t('persons.bulkTerminalCreate.noLinkedDevices'),
                      previewTitle: t('persons.bulkTerminalCreate.previewTitle'),
                      createBadge: t('persons.bulkTerminalCreate.createBadge'),
                      skipBadge: t('persons.bulkTerminalCreate.skipBadge'),
                      noTargetDevicesSelected: t('persons.bulkTerminalCreate.noTargetDevicesSelected')
                    }}
                  />
                ))}
              </div>
            </div>

            {linkedIdentitiesError ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>{t('persons.bulkTerminalCreate.previewLoadFailedTitle')}</AlertTitle>
                <AlertDescription>{linkedIdentitiesError}</AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || pending}
            onClick={() => onSubmit({
              personIds: persons.map((person) => person.id),
              deviceIds: selectedDeviceIds,
              validFrom,
              validTo
            })}
          >
            {pending ? t('persons.bulkTerminalCreate.submitting') : t('persons.bulkTerminalCreate.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
