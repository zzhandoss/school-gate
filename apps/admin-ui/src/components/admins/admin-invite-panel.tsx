import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        {t('admins.invitePanel.createInvite')}
      </Button>
      <Button
        type="button"
        className="sm:hidden"
        disabled={!canManage}
        onClick={() => setIsMobileOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t('admins.invitePanel.invite')}
      </Button>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('admins.invitePanel.sheetTitle')}</SheetTitle>
            <SheetDescription>
              {t('admins.invitePanel.sheetDescription')}
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
            <DrawerTitle>{t('admins.invitePanel.drawerTitle')}</DrawerTitle>
            <DrawerDescription>
              {t('admins.invitePanel.drawerDescription')}
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
