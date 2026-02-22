import type {
  AdminItem,
  AdminRole,
  CreateAdminInviteInput,
  CreateAdminPasswordResetInput,
  CreateRoleInput,
  ListAdminsInput,
  SetAdminRoleInput,
  SetAdminStatusInput,
  UpdateRolePermissionsInput
} from './types'
import { requestApi } from '@/lib/api/client'

type ListAdminsResponse = {
  admins: Array<AdminItem>
}

type ListRolesResponse = {
  roles: Array<AdminRole>
}

type ListRolePermissionsResponse = {
  roleId: string
  permissions: Array<string>
}

type ListPermissionsResponse = {
  permissions: Array<string>
}

type CreateInviteResponse = {
  token: string
  roleId: string
  email: string | null
  expiresAt: string
}

type CreatePasswordResetResponse = {
  token: string
  expiresAt: string
}

type CreateRoleResponse = {
  roleId: string
}

export async function listAdmins(input: ListAdminsInput = {}) {
  const query = new URLSearchParams({
    limit: String(input.limit ?? 50),
    offset: String(input.offset ?? 0)
  })
  const response = await requestApi<ListAdminsResponse>(`/api/admins?${query.toString()}`)
  return response.admins
}

export async function setAdminStatus(adminId: string, input: SetAdminStatusInput) {
  await requestApi(`/api/admins/${adminId}/status`, {
    method: 'PATCH',
    body: input
  })
}

export async function setAdminRole(adminId: string, input: SetAdminRoleInput) {
  await requestApi(`/api/admins/${adminId}/role`, {
    method: 'PATCH',
    body: input
  })
}

export async function createAdminPasswordReset(adminId: string, input: CreateAdminPasswordResetInput) {
  return requestApi<CreatePasswordResetResponse>(`/api/admins/${adminId}/password-reset`, {
    method: 'POST',
    body: input
  })
}

export async function createAdminInvite(input: CreateAdminInviteInput) {
  return requestApi<CreateInviteResponse>('/api/auth/invites', {
    method: 'POST',
    body: input
  })
}

export async function listRoles() {
  const response = await requestApi<ListRolesResponse>('/api/auth/roles')
  return response.roles
}

export async function listRolePermissions(roleId: string) {
  const response = await requestApi<ListRolePermissionsResponse>(`/api/auth/roles/${roleId}/permissions`)
  return response.permissions
}

export async function listPermissions() {
  const response = await requestApi<ListPermissionsResponse>('/api/auth/permissions')
  return response.permissions
}

export async function createRole(input: CreateRoleInput) {
  return requestApi<CreateRoleResponse>('/api/auth/roles', {
    method: 'POST',
    body: input
  })
}

export async function updateRolePermissions(roleId: string, input: UpdateRolePermissionsInput) {
  await requestApi(`/api/auth/roles/${roleId}`, {
    method: 'PATCH',
    body: input
  })
}
