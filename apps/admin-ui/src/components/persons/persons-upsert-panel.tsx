import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'

import { PersonsUpsertForm } from './persons-upsert-form'
import type { CreatePersonWithAutoIdentitiesInput, PersonItem, UpdatePersonInput } from '@/lib/persons/types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type PersonsUpsertPanelProps = {
  mode: 'create' | 'edit'
  person?: PersonItem
  canWrite: boolean
  onSubmit: (input: CreatePersonWithAutoIdentitiesInput | UpdatePersonInput) => Promise<void>
}

export function PersonsUpsertPanel({ mode, person, canWrite, onSubmit }: PersonsUpsertPanelProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const title = mode === 'create' ? 'Create person' : 'Edit person'
  const description =
    mode === 'create'
      ? 'Create person profile in the system.'
      : 'Update person data. Device identities are managed separately.'

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
            Create person
          </Button>
          <Button
            type="button"
            className="sm:hidden"
            disabled={!canWrite}
            onClick={() => setIsMobileOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create
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
            aria-label={`Edit ${person?.iin ?? 'person'}`}
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
          <PersonsUpsertForm
            mode={mode}
            person={person}
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
          <PersonsUpsertForm
            mode={mode}
            person={person}
            canWrite={canWrite}
            onSubmit={onSubmit}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
