import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw, ShieldAlert } from 'lucide-react'

import { AdminInvitePanel } from './admin-invite-panel'
import { AdminsTable } from './admins-table'
import type { AdminItem, AdminRole, AdminStatus } from '@/lib/admins/types'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import {
  createAdminPasswordReset,
  listAdmins,
  listPermissions,
  listRoles,
  setAdminRole,
  setAdminStatus
} from '@/lib/admins/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminsView() {
  const router = useRouter()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canManage = permissions.includes('admin.manage')

  const [admins, setAdmins] = useState<Array<AdminItem>>([])
  const [roles, setRoles] = useState<Array<AdminRole>>([])
  const [allPermissions, setAllPermissions] = useState<Array<string>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<{ token: string; expiresAt: string; resetUrl: string } | null>(null)
  const currentAdminId = session?.admin.id ?? null

  const roleNameById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]))
  }, [roles])

  const lastActiveSuperAdminId = useMemo(() => {
    const activeSuperAdmins = admins.filter((admin) =>
      admin.status === 'active' && roleNameById.get(admin.roleId) === 'super_admin'
    )
    return activeSuperAdmins.length === 1 ? activeSuperAdmins[0].id : null
  }, [admins, roleNameById])

  const stats = useMemo(() => {
    const active = admins.filter((admin) => admin.status === 'active').length
    const disabled = admins.filter((admin) => admin.status === 'disabled').length
    return { total: admins.length, active, disabled }
  }, [admins])

  async function load() {
    setError(null)
    try {
      const [nextAdmins, nextRoles, nextPermissions] = await Promise.all([
        listAdmins({ limit: 200, offset: 0 }),
        listRoles(),
        listPermissions()
      ])
      setAdmins(nextAdmins)
      setRoles(nextRoles)
      setAllPermissions(nextPermissions)
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      setError(value instanceof Error ? value.message : 'Failed to load admins')
    }
  }

  useEffect(() => {
    if (!canManage) {
      setLoading(false)
      return
    }

    async function initialLoad() {
      setLoading(true)
      await load()
      setLoading(false)
    }

    void initialLoad()
  }, [canManage])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function onStatusChange(adminId: string, nextStatus: Extract<AdminStatus, 'active' | 'disabled'>) {
    if (nextStatus === 'disabled' && adminId === lastActiveSuperAdminId) {
      setMutationError('Cannot disable the last active super_admin')
      return
    }

    setMutationError(null)
    setResetResult(null)
    setUpdatingAdminId(adminId)
    try {
      await setAdminStatus(adminId, { status: nextStatus })
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to update admin status')
    } finally {
      setUpdatingAdminId(null)
    }
  }

  async function onRoleChange(adminId: string, roleId: string) {
    if (adminId === currentAdminId) {
      setMutationError('Changing your own role is not allowed')
      return
    }

    setMutationError(null)
    setResetResult(null)
    setUpdatingAdminId(adminId)
    try {
      await setAdminRole(adminId, { roleId })
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to update role')
    } finally {
      setUpdatingAdminId(null)
    }
  }

  async function onCreatePasswordReset(adminId: string) {
    setMutationError(null)
    setResetResult(null)
    setUpdatingAdminId(adminId)
    try {
      const result = await createAdminPasswordReset(adminId, {
        expiresInMs: 24 * 60 * 60 * 1000
      })
      const baseOrigin = typeof window === 'undefined'
        ? ''
        : window.location.origin
      const resetUrl = `${baseOrigin}/password-reset/confirm?token=${encodeURIComponent(result.token)}`
      setResetResult({ ...result, resetUrl })
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to create reset token')
    } finally {
      setUpdatingAdminId(null)
    }
  }

  if (!canManage) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>
          Your account does not have `admin.manage` permission.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>Admins page failed to load</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Admins & access</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin accounts, invite newcomers, and control role assignments.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <AdminInvitePanel
            roles={roles}
            allPermissions={allPermissions}
            canManage={canManage}
            onCreated={load}
          />
          <Button type="button" variant="outline" onClick={() => void router.navigate({ to: '/admins/roles' })}>
            Roles
          </Button>
          <Button type="button" variant="outline" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total admins</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disabled</CardDescription>
            <CardTitle className="text-2xl">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Operation failed</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      {resetResult ? (
        <Alert role="status" className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>Password reset token generated</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Token expires: {new Date(resetResult.expiresAt).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Token</p>
            <Input readOnly className="font-mono text-xs" value={resetResult.token} />
            <p className="text-xs text-muted-foreground">Reset URL</p>
            <Input readOnly className="font-mono text-xs" value={resetResult.resetUrl} />
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Admin registry</CardTitle>
          <CardDescription>
            Update status, change role assignments, and issue password reset links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminsTable
            admins={admins}
            roles={roles}
            canManage={canManage}
            updatingAdminId={updatingAdminId}
            currentAdminId={currentAdminId}
            lastActiveSuperAdminId={lastActiveSuperAdminId}
            onStatusChange={onStatusChange}
            onRoleChange={onRoleChange}
            onCreatePasswordReset={onCreatePasswordReset}
          />
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          Security note
        </p>
        <p className="mt-1">
          Invite and reset tokens are sensitive credentials. Share them only in secure channels.
        </p>
      </div>

      <div className="flex justify-end">
        <Badge variant="outline">permission: admin.manage</Badge>
      </div>
    </div>
  )
}
