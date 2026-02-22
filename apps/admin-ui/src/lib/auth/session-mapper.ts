import type { SessionState } from './types'

type SessionAdminPayload = {
  id: string
  email: string
  status: 'pending' | 'active' | 'disabled'
  name: string | null
  tgUserId: string | null
  roleId?: string | null
  roleName?: string | null
  permissions?: Array<string>
}

export type AuthSessionPayload = {
  admin: SessionAdminPayload
  roleId?: string | null
  roleName?: string | null
  permissions?: Array<string>
}

export function mapSessionPayload(
  payload: AuthSessionPayload,
  fallback: SessionState | null = null
): SessionState {
  const roleId =
    payload.roleId ??
    payload.admin.roleId ??
    fallback?.admin.roleId ??
    'unknown'

  const roleName =
    payload.roleName ??
    payload.admin.roleName ??
    fallback?.admin.roleName ??
    null

  const permissions =
    payload.permissions ??
    payload.admin.permissions ??
    fallback?.admin.permissions ??
    []

  return {
    admin: {
      id: payload.admin.id,
      email: payload.admin.email,
      status: payload.admin.status,
      name: payload.admin.name,
      tgUserId: payload.admin.tgUserId,
      roleId,
      roleName,
      permissions
    }
  }
}
