import { useMemo, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getPersonsImportStrings } from './persons-import-strings'
import { getPersonTerminalToolsStrings } from './person-terminal-tools-strings'
import type { DeviceItem } from '@/lib/devices/types'
import type {
  ApplyPersonsImportResult,
  PersonImportApplyOperation,
  PersonImportCandidateEntry,
  PersonImportCandidateGroup
} from '@/lib/persons/types'
import { applyPersonsImport, listPersonsImportCandidates } from '@/lib/persons/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type PersonTerminalDirectoryAttachDialogProps = {
  personId: string
  personIin: string
  devices: Array<DeviceItem>
  canWrite: boolean
  onApplied: () => Promise<void>
}

type ActionableEntry = {
  key: string
  groupStatus: PersonImportCandidateGroup['status']
  entry: PersonImportCandidateEntry
  deviceName: string
  actionLabel: string
  operation: PersonImportApplyOperation | null
}

function createEntryKey(entry: PersonImportCandidateEntry) {
  return `${entry.deviceId}:${entry.terminalPersonId}:${entry.directoryEntryId}`
}

function buildActionableEntries(
  personId: string,
  groups: Array<PersonImportCandidateGroup>,
  devices: Array<DeviceItem>,
  importStrings: ReturnType<typeof getPersonsImportStrings>,
  strings: ReturnType<typeof getPersonTerminalToolsStrings>
) {
  const deviceNameById = new Map(devices.map((device) => [device.deviceId, device.name]))
  const rows: Array<ActionableEntry> = []

  for (const group of groups) {
    for (const entry of group.entries) {
      let operation: PersonImportApplyOperation | null = null
      let actionLabel = strings.unavailable

      if (entry.linkedPersonId === personId || group.status === 'already_linked') {
        actionLabel = strings.alreadyLinked
      } else if (group.status === 'ready_link' && group.suggestedPersonId === personId) {
        operation = {
          type: 'link_existing',
          directoryEntryIds: [entry.directoryEntryId],
          targetPersonId: personId
        }
        actionLabel = strings.attachAction
      } else if (group.status === 'conflict' && entry.linkedPersonId && entry.linkedPersonId !== personId) {
        operation = {
          type: 'reassign_identity',
          directoryEntryIds: [entry.directoryEntryId],
          targetPersonId: personId,
          expectedCurrentPersonId: entry.linkedPersonId
        }
        actionLabel = strings.reassignAction
      } else if (group.status === 'conflict' && !entry.linkedPersonId && group.suggestedPersonId === personId) {
        operation = {
          type: 'link_existing',
          directoryEntryIds: [entry.directoryEntryId],
          targetPersonId: personId
        }
        actionLabel = strings.attachAction
      }

      rows.push({
        key: createEntryKey(entry),
        groupStatus: group.status,
        entry,
        deviceName: deviceNameById.get(entry.deviceId) ?? entry.deviceId,
        actionLabel:
          operation && group.status === 'conflict'
            ? `${actionLabel} · ${importStrings.statusLabels[group.status]}`
            : actionLabel,
        operation
      })
    }
  }

  return rows
}

function buildApplyOperations(selectedRows: Array<ActionableEntry>) {
  const operations: Array<PersonImportApplyOperation> = []
  const linkIds: Array<string> = []
  const reassignByCurrent = new Map<string, Array<string>>()
  const targetPersonId = selectedRows[0]?.operation?.targetPersonId

  for (const row of selectedRows) {
    if (!row.operation) {
      continue
    }
    if (row.operation.type === 'link_existing') {
      linkIds.push(...row.operation.directoryEntryIds)
      continue
    }
    const currentPersonId = row.operation.expectedCurrentPersonId
    if (!currentPersonId) {
      continue
    }
    const currentIds = reassignByCurrent.get(currentPersonId) ?? []
    currentIds.push(...row.operation.directoryEntryIds)
    reassignByCurrent.set(currentPersonId, currentIds)
  }

  if (linkIds.length > 0 && targetPersonId) {
    operations.push({
      type: 'link_existing',
      directoryEntryIds: Array.from(new Set(linkIds)),
      targetPersonId
    })
  }

  for (const [expectedCurrentPersonId, directoryEntryIds] of reassignByCurrent.entries()) {
    if (!targetPersonId) {
      continue
    }
    operations.push({
      type: 'reassign_identity',
      directoryEntryIds: Array.from(new Set(directoryEntryIds)),
      targetPersonId,
      expectedCurrentPersonId
    })
  }

  return operations
}

export function PersonTerminalDirectoryAttachDialog({
  personId,
  personIin,
  devices,
  canWrite,
  onApplied
}: PersonTerminalDirectoryAttachDialogProps) {
  const { t, i18n } = useTranslation()
  const importStrings = getPersonsImportStrings(i18n.language)
  const strings = getPersonTerminalToolsStrings(i18n.language)
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Array<PersonImportCandidateGroup>>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApplyPersonsImportResult | null>(null)

  const rows = useMemo(
    () => buildActionableEntries(personId, groups, devices, importStrings, strings),
    [devices, groups, importStrings, personId, strings]
  )

  const selectedRows = useMemo(
    () => rows.filter((row) => row.operation && selected[row.key]),
    [rows, selected]
  )

  async function loadCandidates() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const next = await listPersonsImportCandidates({
        iin: personIin,
        includeStale: false,
        limit: 200,
        offset: 0
      })
      setGroups(next.groups)
      const initial: Record<string, boolean> = {}
      for (const row of buildActionableEntries(personId, next.groups, devices, importStrings, strings)) {
        if (row.operation) {
          initial[row.key] = true
        }
      }
      setSelected(initial)
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  async function applySelectedRows() {
    const operations = buildApplyOperations(selectedRows)
    if (operations.length === 0) {
      return
    }

    setApplying(true)
    setError(null)
    try {
      const nextResult = await applyPersonsImport({ operations })
      setResult(nextResult)
      await onApplied()
      await loadCandidates()
    } catch (value) {
      setError(value instanceof Error ? value.message : strings.applyFailed)
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" disabled={!canWrite} onClick={() => {
        setOpen(true)
        void loadCandidates()
      }}>
        <Link2 className="h-4 w-4" />
        {strings.attachButton}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setError(null)
            setResult(null)
            setGroups([])
            setSelected({})
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{strings.attachTitle}</DialogTitle>
            <DialogDescription>{strings.attachDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={loading || applying} onClick={() => void loadCandidates()}>
              {loading ? strings.loadingCandidates : strings.loadCandidates}
            </Button>
            <div className="text-xs text-muted-foreground">
              {strings.selectedCount.replace('{{count}}', String(selectedRows.length))}
            </div>
          </div>

          {error ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {result ? (
            <Alert>
              <AlertTitle>{t('persons.autoDialog.applyResultTitle')}</AlertTitle>
              <AlertDescription>
                {importStrings.applySummary
                  .replace('{{applied}}', String(result.applied))
                  .replace('{{total}}', String(result.total))
                  .replace('{{conflicts}}', String(result.conflicts))
                  .replace('{{errors}}', String(result.errors))}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{importStrings.devices}</TableHead>
                  <TableHead>{t('persons.terminalPersonId')}</TableHead>
                  <TableHead>{importStrings.statusLabel}</TableHead>
                  <TableHead>{importStrings.linkedPerson}</TableHead>
                  <TableHead>{importStrings.details}</TableHead>
                  <TableHead className="w-24 text-right">{t('common.labels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {strings.noCandidates}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{row.deviceName}</p>
                          <p className="text-xs text-muted-foreground">{row.entry.deviceId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {row.entry.terminalPersonId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{importStrings.statusLabels[row.groupStatus]}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.entry.linkedPersonName
                          ? strings.linkedTo.replace('{{value}}', row.entry.linkedPersonName)
                          : t('persons.notLinked')}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {row.entry.displayName ? <p>{row.entry.displayName}</p> : null}
                          {row.entry.cardNo ? <p>{importStrings.card}: {row.entry.cardNo}</p> : null}
                          {row.entry.sourceSummary.length > 0 ? <p>{row.entry.sourceSummary.join(', ')}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant={row.operation ? 'default' : 'secondary'}>{row.actionLabel}</Badge>
                          <Switch
                            checked={Boolean(selected[row.key])}
                            disabled={!row.operation || applying}
                            onCheckedChange={(value) => {
                              setSelected((prev) => ({ ...prev, [row.key]: Boolean(value) }))
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && rows.length > 0 && selectedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{strings.noActionable}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={applying} onClick={() => setOpen(false)}>
              {t('common.actions.close')}
            </Button>
            <Button
              type="button"
              disabled={selectedRows.length === 0 || loading || applying}
              onClick={() => void applySelectedRows()}
            >
              {applying ? strings.applyingSelected : strings.applySelected}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
