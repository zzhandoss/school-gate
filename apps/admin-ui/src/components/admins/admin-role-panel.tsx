import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus } from 'lucide-react'

import { AdminRoleForm } from './admin-role-form'
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

type AdminRolePanelProps = {
  mode: 'create' | 'edit'
  role?: AdminRole
  initialPermissions: Array<string>
  allPermissions: Array<string>
  canManage: boolean
  onSubmit: (input: { name: string; permissions: Array<string> }) => Promise<void>
}

export function AdminRolePanel({
  mode,
  role,
  initialPermissions,
  allPermissions,
  canManage,
  onSubmit
}: AdminRolePanelProps) {
  const { t } = useTranslation()
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const title = mode === 'create'
    ? t('admins.rolePanel.createTitle')
    : t('admins.rolePanel.editTitle', { roleName: role?.name ?? t('admins.rolePanel.roleFallback') })
  const description = mode === 'create'
    ? t('admins.rolePanel.createDescription')
    : t('admins.rolePanel.editDescription')

  return (
    <>
      {mode === 'create' ? (
        <>
          <Button
            type="button"
            className="hidden sm:inline-flex"
            disabled={!canManage}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('admins.rolePanel.createRole')}
          </Button>
          <Button
            type="button"
            className="sm:hidden"
            disabled={!canManage}
            onClick={() => setIsMobileOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('admins.rolePanel.role')}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={!canManage}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('admins.rolePanel.edit')}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="sm:hidden"
            aria-label={t('admins.rolePanel.editAria', { roleName: role?.name ?? t('admins.rolePanel.roleFallback') })}
            disabled={!canManage}
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
          <AdminRoleForm
            mode={mode}
            role={role}
            initialPermissions={initialPermissions}
            allPermissions={allPermissions}
            canManage={canManage}
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
          <AdminRoleForm
            mode={mode}
            role={role}
            initialPermissions={initialPermissions}
            allPermissions={allPermissions}
            canManage={canManage}
            onSubmit={onSubmit}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
