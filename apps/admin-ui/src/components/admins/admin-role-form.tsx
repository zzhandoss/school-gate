import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import type { AdminRole } from '@/lib/admins/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type AdminRoleFormProps = {
  mode: 'create' | 'edit'
  role?: AdminRole
  initialPermissions: Array<string>
  allPermissions: Array<string>
  canManage: boolean
  onSubmit: (input: { name: string; permissions: Array<string> }) => Promise<void>
  onClose: () => void
}

function sortPermissions(value: Array<string>) {
  return [...value].sort((left, right) => left.localeCompare(right))
}

export function AdminRoleForm({
  mode,
  role,
  initialPermissions,
  allPermissions,
  canManage,
  onSubmit,
  onClose
}: AdminRoleFormProps) {
  const [name, setName] = useState(role?.name ?? '')
  const [selectedPermissions, setSelectedPermissions] = useState<Array<string>>(sortPermissions(initialPermissions))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(role?.name ?? '')
    setSelectedPermissions(sortPermissions(initialPermissions))
    setError(null)
  }, [initialPermissions, role?.id, role?.name])

  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions])

  function togglePermission(permission: string, checked: boolean) {
    setSelectedPermissions((current) => {
      if (checked) {
        if (current.includes(permission)) {
          return current
        }
        return sortPermissions([...current, permission])
      }
      return current.filter((value) => value !== permission)
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedName = name.trim()
    if (!normalizedName) {
      setError('Role name is required')
      return
    }

    if (selectedPermissions.length === 0) {
      setError('Select at least one permission')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: normalizedName,
        permissions: selectedPermissions
      })
      onClose()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Failed to save role')
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = !canManage || submitting

  return (
    <form className="space-y-4 p-4 pt-0" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor={`role-name-${mode}`}>Role name</Label>
        <Input
          id={`role-name-${mode}`}
          value={name}
          disabled={disabled || mode === 'edit'}
          onChange={(event) => setName(event.target.value)}
          placeholder="ops_manager"
        />
        {mode === 'edit' ? (
          <p className="text-xs text-muted-foreground">Role name is immutable.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border/70 p-3">
          {allPermissions.map((permission) => {
            const id = `${mode}-${role?.id ?? 'new'}-${permission}`
            return (
              <div key={permission} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
                <Label htmlFor={id} className="text-sm">
                  {permission}
                </Label>
                <Switch
                  id={id}
                  checked={selectedSet.has(permission)}
                  onCheckedChange={(checked) => togglePermission(permission, checked)}
                  disabled={disabled}
                />
              </div>
            )
          })}
        </div>
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Cannot save role</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={disabled}>
          <ShieldCheck className="h-4 w-4" />
          {submitting ? 'Saving...' : mode === 'create' ? 'Create role' : 'Save permissions'}
        </Button>
      </div>
    </form>
  )
}
