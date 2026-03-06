import { useMemo, useState } from 'react'
import { PencilLine, UploadCloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PersonTerminalFaceDialog } from './person-terminal-face-dialog'
import { PersonTerminalDirectoryAttachDialog } from './person-terminal-directory-attach-dialog'
import { PersonTerminalSyncSummary } from './person-terminal-sync-summary'
import { PersonTerminalWriteDialog } from './person-terminal-write-dialog'
import { buildWriteSummaryFields, createDefaultTerminalWriteDraft, createTerminalWritePreload, toOptionalInt, toTerminalDateTime, type PersonTerminalWriteDraft } from './person-terminal-write-form.helpers'
import { getPersonTerminalToolsStrings } from './person-terminal-tools-strings'
import { PersonTerminalWriteConfirmDialog } from './person-terminal-write-confirm-dialog'
import type { DeviceItem } from '@/lib/devices/types'
import type { PersonIdentityItem, PersonItem, PersonTerminalSyncResult } from '@/lib/persons/types'
import { createPersonTerminalUsers, listPersonsImportCandidates, updatePersonTerminalUsers } from '@/lib/persons/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PersonTerminalSyncPanelProps = {
  person: PersonItem
  devices: Array<DeviceItem>
  identities: Array<PersonIdentityItem>
  canWrite: boolean
  onApplied: () => Promise<void>
}

type FormMode = 'create' | 'update' | null

function formatDeviceLabel(device: DeviceItem, terminalPersonId?: string) {
  return `${device.name} (${device.deviceId})${terminalPersonId ? ` | ${terminalPersonId}` : ''}`
}

export function PersonTerminalSyncPanel({ person, devices, identities, canWrite, onApplied }: PersonTerminalSyncPanelProps) {
  const { t, i18n } = useTranslation()
  const strings = getPersonTerminalToolsStrings(i18n.language)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [confirmMode, setConfirmMode] = useState<FormMode>(null)
  const [draft, setDraft] = useState<PersonTerminalWriteDraft>(() => createDefaultTerminalWriteDraft(person))
  const [selectedDevices, setSelectedDevices] = useState<Record<string, boolean>>({})
  const [formWarnings, setFormWarnings] = useState<Array<string>>([])
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [pendingCreate, setPendingCreate] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PersonTerminalSyncResult | null>(null)

  const linkedIdentityByDevice = useMemo(() => new Map(identities.map((identity) => [identity.deviceId, identity])), [identities])
  const linkedDeviceIds = useMemo(() => new Set(identities.map((identity) => identity.deviceId)), [identities])
  const availableCreateDevices = useMemo(() => devices.filter((device) => device.enabled && !linkedDeviceIds.has(device.deviceId)), [devices, linkedDeviceIds])
  const updateDevices = useMemo(() => devices.filter((device) => linkedDeviceIds.has(device.deviceId)), [devices, linkedDeviceIds])
  const pending = pendingCreate || pendingUpdate
  const selectedCreateDeviceIds = useMemo(() => Object.entries(selectedDevices).filter(([, checked]) => checked).map(([deviceId]) => deviceId), [selectedDevices])
  const confirmDevices = useMemo(() => formMode === 'create'
    ? availableCreateDevices.filter((device) => selectedDevices[device.deviceId]).map((device) => formatDeviceLabel(device))
    : updateDevices.map((device) => formatDeviceLabel(device, linkedIdentityByDevice.get(device.deviceId)?.terminalPersonId)), [availableCreateDevices, formMode, linkedIdentityByDevice, selectedDevices, updateDevices])
  const confirmFields = useMemo(() => buildWriteSummaryFields({
    draft,
    notSet: strings.notSet,
    labels: {
      displayName: strings.displayNameLabel,
      citizenIdNo: strings.citizenIdNoLabel,
      terminalPersonId: strings.terminalPersonIdLabel,
      userType: strings.userTypeLabel,
      userStatus: strings.userStatusLabel,
      authority: strings.authorityLabel,
      validFrom: strings.validFromLabel,
      validTo: strings.validToLabel,
      cardNo: strings.cardNoLabel,
      cardName: strings.cardNameLabel,
      cardType: strings.cardTypeLabel,
      cardStatus: strings.cardStatusLabel
    }
  }), [draft, strings])

  function updateDraft(patch: Partial<PersonTerminalWriteDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function resetCreateForm() {
    const defaults = createDefaultTerminalWriteDraft(person)
    setDraft(defaults)
    setSelectedDevices(Object.fromEntries(availableCreateDevices.map((device) => [device.deviceId, true])))
    setFormWarnings([])
  }

  async function openCreateDialog() {
    resetCreateForm()
    setError(null)
    setFormMode('create')
  }

  async function openUpdateDialog() {
    setError(null)
    setLoadingDraft(true)
    setFormWarnings([])
    setFormMode('update')
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
      setDraft(preload.draft)
      setSelectedDevices(Object.fromEntries(updateDevices.map((device) => [device.deviceId, true])))
      setFormWarnings(preload.warnings)
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.updateFailed)
      setFormMode(null)
    } finally {
      setLoadingDraft(false)
    }
  }

  function buildPayload() {
    return {
      terminalPersonId: draft.terminalPersonId.trim(),
      displayName: draft.displayName.trim() || null,
      citizenIdNo: draft.citizenIdNo.trim() || null,
      userType: toOptionalInt(draft.userType),
      userStatus: toOptionalInt(draft.userStatus),
      authority: toOptionalInt(draft.authority),
      validFrom: toTerminalDateTime(draft.validFrom),
      validTo: toTerminalDateTime(draft.validTo),
      ...(draft.cardNo.trim()
        ? {
            card: {
              cardNo: draft.cardNo.trim(),
              ...(draft.cardName.trim() ? { cardName: draft.cardName.trim() } : {}),
              ...(toOptionalInt(draft.cardType) !== null ? { cardType: toOptionalInt(draft.cardType) } : {}),
              ...(toOptionalInt(draft.cardStatus) !== null ? { cardStatus: toOptionalInt(draft.cardStatus) } : {})
            }
          }
        : {})
    }
  }

  async function submitCreate() {
    if (selectedCreateDeviceIds.length === 0) {
      setError(strings.noAvailableDevices)
      return
    }
    setPendingCreate(true)
    setError(null)
    try {
      const nextResult = await createPersonTerminalUsers(person.id, { deviceIds: selectedCreateDeviceIds, ...buildPayload() })
      setResult(nextResult)
      setConfirmMode(null)
      setFormMode(null)
      await onApplied()
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.createFailed)
      setConfirmMode(null)
      setFormMode('create')
    } finally {
      setPendingCreate(false)
    }
  }

  async function submitUpdate() {
    setPendingUpdate(true)
    setError(null)
    try {
      const nextResult = await updatePersonTerminalUsers(person.id, buildPayload())
      setResult(nextResult)
      setConfirmMode(null)
      setFormMode(null)
      await onApplied()
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.updateFailed)
      setConfirmMode(null)
      setFormMode('update')
    } finally {
      setPendingUpdate(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{strings.syncTitle}</h2>
          <p className="max-w-3xl text-xs text-muted-foreground">{strings.syncDescription}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t('persons.deviceIdentities')}: {identities.length}</Badge>
            <Badge variant="outline">{strings.createOnDevices}: {availableCreateDevices.length}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PersonTerminalDirectoryAttachDialog personId={person.id} personIin={person.iin} devices={devices} canWrite={canWrite} onApplied={onApplied} />
          <PersonTerminalFaceDialog person={person} devices={devices} identities={identities} canWrite={canWrite} onApplied={onApplied} />
          <Button type="button" variant="outline" disabled={!canWrite || identities.length === 0 || pending} className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/25" onClick={() => void openUpdateDialog()}>
            <PencilLine className="h-4 w-4" />
            {pendingUpdate ? strings.updatingLinked : strings.updateLinked}
          </Button>
          <Button type="button" variant="outline" disabled={!canWrite || availableCreateDevices.length === 0 || pending} className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-200 dark:hover:bg-emerald-400/25" onClick={() => void openCreateDialog()}>
            <UploadCloud className="h-4 w-4" />
            {strings.createOnDevices}
          </Button>
        </div>
      </div>

      {error ? (
        <Alert className="mt-4 border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <PersonTerminalSyncSummary
          title={result.results[0]?.operation === 'create' ? strings.createOnDevices : strings.updateLinked}
          summaryTemplate={strings.resultSummary}
          result={result}
        />
      ) : null}

      <PersonTerminalWriteDialog
        open={formMode !== null}
        mode={formMode}
        strings={strings}
        closeLabel={t('common.actions.close')}
        devices={formMode === 'create' ? availableCreateDevices : updateDevices}
        draft={draft}
        selectedDevices={selectedDevices}
        warnings={formWarnings}
        loading={loadingDraft}
        pending={pending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !pending) {
            setFormMode(null)
          }
        }}
        onDraftChange={updateDraft}
        onUseIin={() => updateDraft({ terminalPersonId: person.iin })}
        onToggleDevice={(deviceId, nextValue) => setSelectedDevices((current) => ({ ...current, [deviceId]: nextValue }))}
        onReview={() => setConfirmMode(formMode)}
      />

      <PersonTerminalWriteConfirmDialog
        open={confirmMode === 'create'}
        mode="create"
        person={person}
        devices={confirmDevices}
        fields={confirmFields}
        pending={pendingCreate}
        title={strings.confirmCreateTitle}
        description={strings.confirmCreateDescription}
        actionLabel={pendingCreate ? strings.creating : strings.confirmCreateAction}
        warningLabel={strings.confirmWarningTitle}
        warningDescription={strings.confirmCreateWarningDescription}
        fieldsTitle={strings.confirmFieldsTitle}
        devicesTitle={strings.confirmDevicesTitle}
        onCancel={() => { if (!pendingCreate) { setConfirmMode(null); setFormMode('create') } }}
        onConfirm={() => void submitCreate()}
      />

      <PersonTerminalWriteConfirmDialog
        open={confirmMode === 'update'}
        mode="update"
        person={person}
        devices={confirmDevices}
        fields={confirmFields}
        pending={pendingUpdate}
        title={strings.confirmUpdateTitle}
        description={strings.confirmUpdateDescription}
        actionLabel={pendingUpdate ? strings.updatingLinked : strings.confirmUpdateAction}
        warningLabel={strings.confirmWarningTitle}
        warningDescription={strings.confirmUpdateWarningDescription}
        fieldsTitle={strings.confirmFieldsTitle}
        devicesTitle={strings.confirmDevicesTitle}
        onCancel={() => { if (!pendingUpdate) { setConfirmMode(null); setFormMode('update') } }}
        onConfirm={() => void submitUpdate()}
      />
    </div>
  )
}
