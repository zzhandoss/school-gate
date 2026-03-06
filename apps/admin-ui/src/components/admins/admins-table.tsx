import { KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AdminItem, AdminRole, AdminStatus } from '@/lib/admins/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type AdminsTableProps = {
  admins: Array<AdminItem>
  roles: Array<AdminRole>
  canManage: boolean
  updatingAdminId: string | null
  currentAdminId: string | null
  lastActiveSuperAdminId: string | null
  onStatusChange: (adminId: string, nextStatus: Extract<AdminStatus, 'active' | 'disabled'>) => Promise<void>
  onRoleChange: (adminId: string, roleId: string) => Promise<void>
  onCreatePasswordReset: (adminId: string) => Promise<void>
}

const STATUS_VARIANT: Record<AdminStatus, 'default' | 'outline' | 'secondary'> = {
  active: 'default',
  pending: 'outline',
  disabled: 'secondary'
}

export function AdminsTable({
  admins,
  roles,
  canManage,
  updatingAdminId,
  currentAdminId,
  lastActiveSuperAdminId,
  onStatusChange,
  onRoleChange,
  onCreatePasswordReset
}: AdminsTableProps) {
  const { t } = useTranslation()
  const roleNameById = new Map(roles.map((role) => [role.id, role.name]))

  if (admins.length === 0) {
    return (
        <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        {t('admins.noAdminsFound')}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admins.table.admin')}</TableHead>
          <TableHead>{t('common.labels.status')}</TableHead>
          <TableHead>{t('app.shell.role')}</TableHead>
          <TableHead>{t('common.labels.telegram')}</TableHead>
          <TableHead>{t('common.labels.created')}</TableHead>
          <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => {
          const isUpdating = updatingAdminId === admin.id
          const isSelf = currentAdminId === admin.id
          const isLastActiveSuperAdmin = lastActiveSuperAdminId === admin.id
          const statusDisabled = !canManage || isUpdating || isLastActiveSuperAdmin
          const roleDisabled = !canManage || isUpdating || roles.length === 0 || isSelf
          return (
            <TableRow key={admin.id}>
              <TableCell>
                <div className="min-w-[180px]">
                  <p className="truncate text-sm font-medium text-foreground">{admin.name ?? t('admins.table.unnamedAdmin')}</p>
                  <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-2">
                  <Badge variant={STATUS_VARIANT[admin.status]}>
                    {t(`enums.adminStatus.${admin.status}`)}
                  </Badge>
                  <Select
                    value={admin.status}
                    disabled={statusDisabled}
                    onValueChange={(value) => {
                      if (value === 'pending') {
                        return
                      }
                      void onStatusChange(admin.id, value as 'active' | 'disabled')
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('enums.adminStatus.pending')}</SelectItem>
                      <SelectItem value="active">{t('enums.adminStatus.active')}</SelectItem>
                      <SelectItem value="disabled">{t('enums.adminStatus.disabled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>

              <TableCell>
                <Select
                  value={admin.roleId}
                  disabled={roleDisabled}
                  onValueChange={(value) => onRoleChange(admin.id, value)}
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder={t('admins.table.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {roleNameById.get(admin.roleId) ?? admin.roleId}
                </p>
                {isSelf ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('admins.cannotChangeOwnRole')}
                  </p>
                ) : null}
                {isLastActiveSuperAdmin ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('admins.cannotDisableLastSuperAdmin')}
                  </p>
                ) : null}
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {admin.tgUserId ?? t('admins.table.notLinked')}
                </span>
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canManage || isUpdating}
                  onClick={() => onCreatePasswordReset(admin.id)}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {t('admins.table.resetPassword')}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
