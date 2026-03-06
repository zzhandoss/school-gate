import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { PersonTerminalWriteForm } from './person-terminal-write-form'
import type { PersonTerminalWriteDraft } from './person-terminal-write-form.helpers'
import type { PersonTerminalToolsStrings } from './person-terminal-tools-strings'
import type { DeviceItem } from '@/lib/devices/types'

type PersonTerminalWriteDialogProps = {
  open: boolean
  mode: 'create' | 'update' | null
  strings: PersonTerminalToolsStrings
  closeLabel: string
  devices: Array<DeviceItem>
  draft: PersonTerminalWriteDraft
  selectedDevices: Record<string, boolean>
  warnings: Array<string>
  loading: boolean
  pending: boolean
  onOpenChange: (nextOpen: boolean) => void
  onDraftChange: (patch: Partial<PersonTerminalWriteDraft>) => void
  onUseIin: () => void
  onToggleDevice: (deviceId: string, nextValue: boolean) => void
  onReview: () => void
}

export function PersonTerminalWriteDialog({
  open,
  mode,
  strings,
  closeLabel,
  devices,
  draft,
  selectedDevices,
  warnings,
  loading,
  pending,
  onOpenChange,
  onDraftChange,
  onUseIin,
  onToggleDevice,
  onReview
}: PersonTerminalWriteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? strings.createDialogTitle : strings.updateDialogTitle}</DialogTitle>
          <DialogDescription>{mode === 'create' ? strings.createDialogDescription : strings.updateDialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {mode ? (
            <PersonTerminalWriteForm
              mode={mode}
              draft={draft}
              devices={devices}
              selectedDevices={selectedDevices}
              warnings={warnings}
              loading={loading}
              pending={pending}
              onDraftChange={onDraftChange}
              onUseIin={onUseIin}
              onToggleDevice={onToggleDevice}
            />
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
          <Button
            type="button"
            disabled={pending || loading || draft.terminalPersonId.trim().length === 0}
            className={mode === 'create'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300'}
            onClick={onReview}
          >
            {mode === 'create' ? strings.createSelected : strings.confirmUpdateAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
