import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'

import { PersonIdentityForm } from './person-identity-form'
import type { PersonIdentityItem, UpsertPersonIdentityInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type PersonIdentityPanelProps = {
  mode: 'create' | 'edit'
  identity?: PersonIdentityItem
  personIin?: string
  devices: Array<DeviceItem>
  canWrite: boolean
  onSubmit: (input: UpsertPersonIdentityInput) => Promise<void>
}

export function PersonIdentityPanel({ mode, identity, personIin, devices, canWrite, onSubmit }: PersonIdentityPanelProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const title = mode === 'create' ? 'Add identity' : 'Edit identity'
  const description =
    mode === 'create'
      ? 'Bind person to specific device and terminal person id.'
      : 'Update device mapping for this person.'

  return (
    <>
      {mode === 'create' ? (
        <>
          <Button
            type="button"
            className="hidden sm:inline-flex"
            disabled={!canWrite}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add identity
          </Button>
          <Button
            type="button"
            className="sm:hidden"
            disabled={!canWrite}
            onClick={() => setIsMobileOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={!canWrite}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="sm:hidden"
            disabled={!canWrite}
            aria-label="Edit identity"
            onClick={() => setIsMobileOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <PersonIdentityForm
            mode={mode}
            identity={identity}
            personIin={personIin}
            devices={devices.map((device) => ({ deviceId: device.deviceId, name: device.name }))}
            canWrite={canWrite}
            onSubmit={onSubmit}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <PersonIdentityForm
            mode={mode}
            identity={identity}
            personIin={personIin}
            devices={devices.map((device) => ({ deviceId: device.deviceId, name: device.name }))}
            canWrite={canWrite}
            onSubmit={onSubmit}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
