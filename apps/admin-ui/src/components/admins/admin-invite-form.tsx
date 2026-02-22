import { useEffect, useMemo, useState } from 'react'
import { Copy, Link as LinkIcon } from 'lucide-react'

import type { AdminRole } from '@/lib/admins/types'
import { createAdminInvite, createRole } from '@/lib/admins/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type AdminInviteFormProps = {
  roles: Array<AdminRole>
  allPermissions: Array<string>
  canManage: boolean
  onCreated: () => Promise<void>
  onClose: () => void
}

type RoleMode = 'existing' | 'new'

const EXPIRATION_OPTIONS = [
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  { label: '72 hours', value: 72 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 }
] as const

function sortPermissions(input: Array<string>) {
  return [...input].sort((left, right) => left.localeCompare(right))
}

function buildPresetPermissions(allPermissions: Array<string>) {
  const viewer = allPermissions.filter((permission) => permission.endsWith('.read'))
  const operator = allPermissions.filter((permission) => permission !== 'admin.manage')
  const admin = [...allPermissions]

  return {
    viewer: sortPermissions(viewer),
    operator: sortPermissions(operator),
    admin: sortPermissions(admin)
  }
}

export function AdminInviteForm({ roles, allPermissions, canManage, onCreated, onClose }: AdminInviteFormProps) {
  const defaultRoleId = roles[0]?.id ?? ''

  const [roleMode, setRoleMode] = useState<RoleMode>(roles.length > 0 ? 'existing' : 'new')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState(defaultRoleId)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRolePermissions, setNewRolePermissions] = useState<Array<string>>([])
  const [expiresInMs, setExpiresInMs] = useState(String(EXPIRATION_OPTIONS[1].value))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteResult, setInviteResult] = useState<{
    token: string
    expiresAt: string
    roleName: string
  } | null>(null)

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const role of roles) {
      map.set(role.id, role.name)
    }
    return map
  }, [roles])
  const presetPermissions = useMemo(() => buildPresetPermissions(allPermissions), [allPermissions])

  const selectedPermissions = useMemo(() => new Set(newRolePermissions), [newRolePermissions])
  const inviteLink = useMemo(() => {
    if (!inviteResult) {
      return ''
    }
    if (typeof window === 'undefined') {
      return `/invite?token=${encodeURIComponent(inviteResult.token)}`
    }
    return `${window.location.origin}/invite?token=${encodeURIComponent(inviteResult.token)}`
  }, [inviteResult])

  useEffect(() => {
    if (roles.length === 0) {
      setRoleMode('new')
      return
    }

    if (!roleId && defaultRoleId) {
      setRoleId(defaultRoleId)
    }
  }, [defaultRoleId, roleId, roles.length])

  function togglePermission(permission: string, checked: boolean) {
    setNewRolePermissions((current) => {
      if (checked) {
        if (current.includes(permission)) {
          return current
        }
        return sortPermissions([...current, permission])
      }
      return current.filter((value) => value !== permission)
    })
  }

  function applyPreset(preset: keyof ReturnType<typeof buildPresetPermissions>) {
    setNewRolePermissions(presetPermissions[preset])
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManage) {
      setError('Missing admin.manage permission')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    let resolvedRoleId = roleId
    let resolvedRoleName = roleNameById.get(roleId) ?? roleId

    if (roleMode === 'existing') {
      if (!resolvedRoleId) {
        setError('Role is required')
        return
      }
    } else {
      const normalizedRoleName = newRoleName.trim()
      if (!normalizedRoleName) {
        setError('New role name is required')
        return
      }
      if (newRolePermissions.length === 0) {
        setError('Select at least one permission for new role')
        return
      }

      setSubmitting(true)
      setError(null)
      try {
        const roleResponse = await createRole({
          name: normalizedRoleName,
          permissions: newRolePermissions
        })
        resolvedRoleId = roleResponse.roleId
        resolvedRoleName = normalizedRoleName
      } catch (value) {
        setSubmitting(false)
        setError(value instanceof Error ? value.message : 'Failed to create role')
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      const result = await createAdminInvite({
        email: email.trim(),
        roleId: resolvedRoleId,
        expiresInMs: Number(expiresInMs)
      })
      setInviteResult({ token: result.token, expiresAt: result.expiresAt, roleName: resolvedRoleName })
      if (roleMode === 'new') {
        setRoleId(resolvedRoleId)
        setRoleMode('existing')
      }
      await onCreated()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyText(value: string, failureMessage: string) {
    if (!value) {
      return
    }

    setError(null)
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      setError(failureMessage)
    }
  }

  async function onCopyToken() {
    if (!inviteResult) {
      return
    }

    await copyText(inviteResult.token, 'Cannot copy invite token in this browser')
  }

  async function onCopyLink() {
    if (!inviteLink) {
      return
    }

    await copyText(inviteLink, 'Cannot copy invite link in this browser')
  }

  return (
    <form className="space-y-4 p-4 pt-0" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="invite-email">Admin email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          disabled={!canManage || submitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Role source</Label>
        <Tabs value={roleMode} onValueChange={(value) => setRoleMode(value as RoleMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="cursor-pointer" disabled={roles.length === 0}>
              Existing role
            </TabsTrigger>
            <TabsTrigger value="new" className="cursor-pointer">
              New role
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {roleMode === 'existing' ? (
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            value={roleId}
            onValueChange={setRoleId}
            disabled={!canManage || submitting || roles.length === 0}
          >
            <SelectTrigger id="invite-role" className="w-full">
              <SelectValue placeholder="Choose role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No roles available yet. Create a new role.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border/70 bg-background/70 p-3">
          <div className="space-y-2">
            <Label htmlFor="new-role-name">New role name</Label>
            <Input
              id="new-role-name"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              placeholder="ops_manager"
              disabled={!canManage || submitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManage || submitting || presetPermissions.viewer.length === 0}
                onClick={() => applyPreset('viewer')}
              >
                Viewer preset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManage || submitting || presetPermissions.operator.length === 0}
                onClick={() => applyPreset('operator')}
              >
                Operator preset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManage || submitting || presetPermissions.admin.length === 0}
                onClick={() => applyPreset('admin')}
              >
                Admin preset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Presets are shortcuts. You can still fine-tune permissions below.
            </p>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border/70 p-2">
              {allPermissions.map((permission) => {
                const itemId = `invite-role-${permission}`
                return (
                  <div key={permission} className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
                    <Label htmlFor={itemId} className="text-sm">
                      {permission}
                    </Label>
                    <Switch
                      id={itemId}
                      checked={selectedPermissions.has(permission)}
                      onCheckedChange={(checked) => togglePermission(permission, checked)}
                      disabled={!canManage || submitting}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invite-expiration">Expiration</Label>
        <Select
          value={expiresInMs}
          onValueChange={setExpiresInMs}
          disabled={!canManage || submitting}
        >
          <SelectTrigger id="invite-expiration" className="w-full">
            <SelectValue placeholder="Select expiration" />
          </SelectTrigger>
          <SelectContent>
            {EXPIRATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Invite creation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {inviteResult ? (
        <Alert role="status" className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>Invite created</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Role: {inviteResult.roleName}</p>
            <p>Expires: {new Date(inviteResult.expiresAt).toLocaleString()}</p>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/80">Invite code</p>
              <div className="flex gap-2">
                <Input readOnly value={inviteResult.token} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={() => void onCopyToken()}>
                  <Copy className="h-4 w-4" />
                  Copy code
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/80">Invite link</p>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="text-xs" />
                <Button type="button" variant="outline" onClick={() => void onCopyLink()}>
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" disabled={!canManage || submitting}>
          <LinkIcon className="h-4 w-4" />
          {submitting ? 'Creating...' : roleMode === 'new' ? 'Create role + invite' : 'Create invite'}
        </Button>
      </div>
    </form>
  )
}
