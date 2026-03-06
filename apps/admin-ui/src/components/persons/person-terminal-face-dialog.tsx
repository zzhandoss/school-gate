import { useMemo, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { createTerminalWritePreload, toOptionalInt, toTerminalDateTime } from './person-terminal-write-form.helpers'
import { PersonTerminalFaceConfirmDialog } from './person-terminal-face-confirm-dialog'
import { PersonTerminalFaceDialogContent } from './person-terminal-face-dialog-content'
import { getPersonTerminalToolsStrings } from './person-terminal-tools-strings'
import type { DeviceItem } from '@/lib/devices/types'
import type { PersonIdentityItem, PersonItem, PersonTerminalSyncResult } from '@/lib/persons/types'
import { listPersonsImportCandidates, updatePersonTerminalUsers } from '@/lib/persons/service'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type PersonTerminalFaceDialogProps = {
  person: PersonItem
  devices: Array<DeviceItem>
  identities: Array<PersonIdentityItem>
  canWrite: boolean
  onApplied: () => Promise<void>
}

function formatDeviceLabel(device: DeviceItem, terminalPersonId?: string) {
  return `${device.name} (${device.deviceId})${terminalPersonId ? ` | ${terminalPersonId}` : ''}`
}

function replaceSummary(template: string, result: PersonTerminalSyncResult) {
  return template.replace('{{success}}', String(result.success)).replace('{{failed}}', String(result.failed))
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('read_failed'))
    }
    reader.readAsDataURL(file)
  })
}

function extractBase64Payload(dataUrl: string) {
  const [, payload] = dataUrl.split(',', 2)
  return payload ?? ''
}

export function PersonTerminalFaceDialog({ person, devices, identities, canWrite, onApplied }: PersonTerminalFaceDialogProps) {
  const { t, i18n } = useTranslation()
  const strings = getPersonTerminalToolsStrings(i18n.language)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<Array<string>>([])
  const [selectedDevices, setSelectedDevices] = useState<Record<string, boolean>>({})
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [photoBase64, setPhotoBase64] = useState<string>('')
  const [result, setResult] = useState<PersonTerminalSyncResult | null>(null)
  const [draftPayload, setDraftPayload] = useState<{
    terminalPersonId: string
    displayName: string
    citizenIdNo: string
    userType: string
    userStatus: string
    authority: string
    validFrom: string
    validTo: string
    cardNo: string
    cardName: string
    cardType: string
    cardStatus: string
  } | null>(null)

  const linkedIdentityByDevice = useMemo(() => new Map(identities.map((identity) => [identity.deviceId, identity])), [identities])
  const linkedDevices = useMemo(() => devices.filter((device) => linkedIdentityByDevice.has(device.deviceId)), [devices, linkedIdentityByDevice])
  const selectedDeviceIds = useMemo(() => Object.entries(selectedDevices).filter(([, checked]) => checked).map(([deviceId]) => deviceId), [selectedDevices])
  const selectedDeviceLabels = useMemo(
    () => linkedDevices.filter((device) => selectedDevices[device.deviceId]).map((device) => formatDeviceLabel(device, linkedIdentityByDevice.get(device.deviceId)?.terminalPersonId)),
    [linkedDevices, linkedIdentityByDevice, selectedDevices]
  )

  async function openDialog() {
    setOpen(true)
    setError(null)
    setWarnings([])
    setPreviewUrl('')
    setPhotoBase64('')
    setResult(null)
    setConfirmOpen(false)
    setLoadingDraft(true)

    try {
      const response = await listPersonsImportCandidates({ iin: person.iin, includeStale: false, limit: 200, offset: 0 })
      const linkedKeys = new Set(identities.map((identity) => `${identity.deviceId}:${identity.terminalPersonId}`))
      const entries = response.groups.flatMap((group) => group.entries).filter((entry) => linkedKeys.has(`${entry.deviceId}:${entry.terminalPersonId}`))
      const preload = createTerminalWritePreload({
        person,
        entries,
        missingDeviceCount: Math.max(identities.length - entries.length, 0),
        missingWarning: strings.snapshotMissingWarning,
        mismatchWarnings: {
          terminalPersonId: strings.snapshotMismatchWarning,
          displayName: strings.snapshotMismatchWarning,
          citizenIdNo: strings.snapshotMismatchWarning,
          userType: strings.snapshotMismatchWarning,
          userStatus: strings.snapshotMismatchWarning,
          authority: strings.snapshotMismatchWarning,
          validFrom: strings.snapshotMismatchWarning,
          validTo: strings.snapshotMismatchWarning,
          cardNo: strings.snapshotMismatchWarning,
          cardName: strings.snapshotMismatchWarning,
          cardType: strings.snapshotMismatchWarning,
          cardStatus: strings.snapshotMismatchWarning
        }
      })

      setDraftPayload(preload.draft)
      setWarnings(preload.warnings)
      setSelectedDevices(Object.fromEntries(linkedDevices.map((device) => [device.deviceId, true])))
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.faceUpdateFailed)
      setOpen(false)
    } finally {
      setLoadingDraft(false)
    }
  }

  async function onFileSelected(file: File | null) {
    if (!file) {
      return
    }
    try {
      const dataUrl = await readImageAsDataUrl(file)
      const base64 = extractBase64Payload(dataUrl)
      if (!base64) {
        throw new Error('empty_image_payload')
      }
      setPreviewUrl(dataUrl)
      setPhotoBase64(base64)
      setResult(null)
      setError(null)
    } catch {
      setError(strings.faceUploadFailed)
    }
  }

  async function submit() {
    if (!draftPayload || !photoBase64 || selectedDeviceIds.length === 0) {
      return
    }
    setPending(true)
    setError(null)
    try {
      const nextResult = await updatePersonTerminalUsers(person.id, {
        deviceIds: selectedDeviceIds,
        terminalPersonId: draftPayload.terminalPersonId,
        displayName: draftPayload.displayName,
        citizenIdNo: draftPayload.citizenIdNo,
        userType: toOptionalInt(draftPayload.userType),
        userStatus: toOptionalInt(draftPayload.userStatus),
        authority: toOptionalInt(draftPayload.authority),
        validFrom: toTerminalDateTime(draftPayload.validFrom),
        validTo: toTerminalDateTime(draftPayload.validTo),
        ...(draftPayload.cardNo.trim()
          ? {
              card: {
                cardNo: draftPayload.cardNo.trim(),
                ...(draftPayload.cardName.trim() ? { cardName: draftPayload.cardName.trim() } : {}),
                ...(toOptionalInt(draftPayload.cardType) !== null ? { cardType: toOptionalInt(draftPayload.cardType) } : {}),
                ...(toOptionalInt(draftPayload.cardStatus) !== null ? { cardStatus: toOptionalInt(draftPayload.cardStatus) } : {})
              }
            }
          : {}),
        face: {
          photosBase64: [photoBase64]
        }
      })
      const summary = replaceSummary(strings.resultSummary, nextResult)
      setConfirmOpen(false)
      await onApplied()
      if (nextResult.failed === 0) {
        setResult(null)
        setOpen(false)
        toast.success(strings.updateFace, {
          description: summary
        })
        return
      }

      setResult(nextResult)
      toast.error(strings.faceUpdateFailed, {
        description: summary
      })
    } catch (value) {
      const nextError = value instanceof Error ? value.message : strings.faceUpdateFailed
      setError(nextError)
      setConfirmOpen(false)
      setOpen(true)
      toast.error(strings.faceUpdateFailed, {
        description: nextError
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={!canWrite || identities.length === 0 || pending}
        className="border-sky-500/40 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 hover:text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-200 dark:hover:bg-sky-400/25"
        onClick={() => void openDialog()}
      >
        <ImagePlus className="h-4 w-4" />
        {pending ? strings.updatingFace : strings.updateFace}
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!pending) {
          if (!nextOpen) {
            setResult(null)
          }
          setOpen(nextOpen)
        }
      }}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{strings.faceDialogTitle}</DialogTitle>
            <DialogDescription>{strings.faceDialogDescription}</DialogDescription>
          </DialogHeader>

          <PersonTerminalFaceDialogContent
            personId={person.id}
            errorTitle={t('persons.mutationFailedTitle')}
            error={error}
            warnings={warnings}
            strings={strings}
            loadingDraft={loadingDraft}
            linkedDevices={linkedDevices}
            identities={identities}
            selectedDevices={selectedDevices}
            pending={pending}
            previewUrl={previewUrl}
            result={result}
            onFileSelected={onFileSelected}
            onToggleDevice={(deviceId, nextValue) => {
              setSelectedDevices((current) => ({ ...current, [deviceId]: nextValue }))
            }}
          />

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              {t('common.actions.close')}
            </Button>
            <Button
              type="button"
              disabled={pending || loadingDraft || !photoBase64 || selectedDeviceIds.length === 0 || !draftPayload}
              className="bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
              onClick={() => setConfirmOpen(true)}
            >
              {pending ? strings.updatingFace : strings.faceConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewUrl ? (
        <PersonTerminalFaceConfirmDialog
          open={confirmOpen}
          person={person}
          devices={selectedDeviceLabels}
          previewUrl={previewUrl}
          pending={pending}
          title={strings.faceConfirmTitle}
          description={strings.faceConfirmDescription}
          actionLabel={pending ? strings.updatingFace : strings.faceConfirmAction}
          warningLabel={strings.confirmWarningTitle}
          warningDescription={strings.faceConfirmWarningDescription}
          devicesTitle={strings.confirmDevicesTitle}
          previewTitle={strings.facePreviewTitle}
          personTitle={strings.facePersonTitle}
          previewAlt={strings.facePreviewAlt}
          onCancel={() => {
            if (!pending) {
              setConfirmOpen(false)
              setOpen(true)
            }
          }}
          onConfirm={() => void submit()}
        />
      ) : null}
    </>
  )
}
