import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AdminRolePanel } from './admin-role-panel'
import type { AdminRole } from '@/lib/admins/types'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import {
  createRole,
  listPermissions,
  listRolePermissions,
  listRoles,
  updateRolePermissions
} from '@/lib/admins/service'
import { permissionLabel } from '@/lib/i18n/enum-labels'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type RolePermissionsMap = Record<string, Array<string>>

export function AdminRolesView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canManage = permissions.includes('admin.manage')

  const [roles, setRoles] = useState<Array<AdminRole>>([])
  const [allPermissions, setAllPermissions] = useState<Array<string>>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const permissionUsage = useMemo(() => {
    const map = new Map<string, number>()
    for (const permissionList of Object.values(rolePermissions)) {
      for (const permission of permissionList) {
        map.set(permission, (map.get(permission) ?? 0) + 1)
      }
    }
    return map
  }, [rolePermissions])
  const mostUsedPermission = useMemo(
    () =>
      allPermissions
        .slice()
        .sort((left, right) => (permissionUsage.get(right) ?? 0) - (permissionUsage.get(left) ?? 0))[0] ?? null,
    [allPermissions, permissionUsage]
  )

  async function load() {
    setError(null)
    try {
      const [nextRoles, nextPermissions] = await Promise.all([listRoles(), listPermissions()])
      const permissionsByRole = await Promise.all(
        nextRoles.map(async (role) => ({
          roleId: role.id,
          permissions: await listRolePermissions(role.id)
        }))
      )

      setRoles(nextRoles)
      setAllPermissions(nextPermissions)
      setRolePermissions(
        permissionsByRole.reduce<RolePermissionsMap>((accumulator, item) => {
          accumulator[item.roleId] = item.permissions
          return accumulator
        }, {})
      )
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      setError(value instanceof Error ? value.message : t('roles.loadFailed'))
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

  async function onCreateRole(input: { name: string; permissions: Array<string> }) {
    setMutationError(null)
    try {
      await createRole(input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('roles.createFailed'))
      throw value
    }
  }

  async function onUpdateRole(roleId: string, input: { permissions: Array<string> }) {
    setMutationError(null)
    try {
      await updateRolePermissions(roleId, { permissions: input.permissions })
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('roles.updateFailed'))
      throw value
    }
  }

  if (!canManage) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>
          {t('admins.accessDeniedDescription')}
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
        <AlertTitle>{t('roles.pageLoadFailedTitle')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('roles.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('roles.subtitle')}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <AdminRolePanel
            mode="create"
            initialPermissions={[]}
            allPermissions={allPermissions}
            canManage={canManage}
            onSubmit={onCreateRole}
          />
          <Button type="button" variant="outline" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('common.actions.refreshing') : t('common.actions.refresh')}
          </Button>
        </div>
      </div>

      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('roles.operationFailedTitle')}</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('roles.total')}</CardDescription>
            <CardTitle className="text-2xl">{roles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('roles.uniquePermissions')}</CardDescription>
            <CardTitle className="text-2xl">{allPermissions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('roles.mostUsedPermission')}</CardDescription>
            <CardTitle className="text-base">
              {mostUsedPermission ? permissionLabel(t, mostUsedPermission) : t('devices.noValue')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const permissionsForRole = rolePermissions[role.id] ?? []
          return (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <CardDescription>
                    {t('roles.permissionsAssigned', { count: permissionsForRole.length })}
                  </CardDescription>
                </div>
                <AdminRolePanel
                  mode="edit"
                  role={role}
                  initialPermissions={permissionsForRole}
                  allPermissions={allPermissions}
                  canManage={canManage}
                  onSubmit={(input) => onUpdateRole(role.id, input)}
                />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {permissionsForRole.length > 0 ? (
                    permissionsForRole.map((permission) => (
                      <Badge key={permission} variant="outline" title={permission}>
                        {permissionLabel(t, permission)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('roles.noPermissionsAssigned')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
