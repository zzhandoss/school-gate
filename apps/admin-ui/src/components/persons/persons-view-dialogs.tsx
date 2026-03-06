import { PersonDeleteDialog } from './person-delete-dialog'
import { PersonsBulkTerminalCreateDialog } from './persons-bulk-terminal-create-dialog'
import type { PersonItem } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'

type PersonsViewDialogsProps = {
  bulkCreateOpen: boolean
  bulkCreating: boolean
  bulkDeleteOpen: boolean
  deleteTarget: PersonItem | null
  deleting: boolean
  devices: Array<DeviceItem>
  error: string | null
  selectedVisibleIds: Array<string>
  selectedVisiblePersons: Array<PersonItem>
  setBulkCreateOpen: (open: boolean) => void
  setBulkDeleteOpen: (open: boolean) => void
  setDeleteTarget: (person: PersonItem | null) => void
  onConfirmDelete: () => void
  onBulkCreate: (input: { personIds: Array<string>; deviceIds: Array<string>; validFrom: string; validTo: string }) => void
}

export function PersonsViewDialogs({
  bulkCreateOpen,
  bulkCreating,
  bulkDeleteOpen,
  deleteTarget,
  deleting,
  devices,
  error,
  selectedVisibleIds,
  selectedVisiblePersons,
  setBulkCreateOpen,
  setBulkDeleteOpen,
  setDeleteTarget,
  onConfirmDelete,
  onBulkCreate
}: PersonsViewDialogsProps) {
  return (
    <>
      <PersonDeleteDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)} deleting={deleting} count={1} personName={deleteTarget ? [deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(' ') : null} onConfirm={onConfirmDelete} />
      <PersonDeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} deleting={deleting} count={selectedVisibleIds.length} onConfirm={onConfirmDelete} />
      <PersonsBulkTerminalCreateDialog open={bulkCreateOpen} pending={bulkCreating} persons={selectedVisiblePersons} devices={devices} error={error} onOpenChange={setBulkCreateOpen} onSubmit={onBulkCreate} />
    </>
  )
}
