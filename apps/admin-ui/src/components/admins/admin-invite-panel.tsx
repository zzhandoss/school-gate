import { useState } from 'react'
import { Plus } from 'lucide-react'

import { AdminInviteForm } from './admin-invite-form'
import type { AdminRole } from '@/lib/admins/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'

type AdminInvitePanelProps = {
  roles: Array<AdminRole>
  allPermissions: Array<string>
  canManage: boolean
  onCreated: () => Promise<void>
}

export function AdminInvitePanel({ roles, allPermissions, canManage, onCreated }: AdminInvitePanelProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        className="hidden sm:inline-flex"
        disabled={!canManage}
        onClick={() => setIsDesktopOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Create invite
      </Button>
      <Button
        type="button"
        className="sm:hidden"
        disabled={!canManage}
        onClick={() => setIsMobileOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Invite
      </Button>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create admin invite</SheetTitle>
            <SheetDescription>
              Generate secure invite token for a new admin account.
            </SheetDescription>
          </SheetHeader>
          <AdminInviteForm
            roles={roles}
            allPermissions={allPermissions}
            canManage={canManage}
            onCreated={onCreated}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create admin invite</DrawerTitle>
            <DrawerDescription>
              Select role and expiration, then generate one-time token.
            </DrawerDescription>
          </DrawerHeader>
          <AdminInviteForm
            roles={roles}
            allPermissions={allPermissions}
            canManage={canManage}
            onCreated={onCreated}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
