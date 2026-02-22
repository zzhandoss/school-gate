export type AdminSessionUser = {
  id: string
  email: string
  roleId: string
  roleName: string | null
  permissions: Array<string>
  status: 'pending' | 'active' | 'disabled'
  name: string | null
  tgUserId: string | null
}

export type SessionState = {
  admin: AdminSessionUser
}

export type LoginInput = {
  email: string
  password: string
}

export type RequestTelegramLoginCodeInput = {
  email: string
  expiresInMs?: number
}

export type TelegramOtpLoginInput = {
  email: string
  code: string
}

export type AcceptInviteInput = {
  token: string
  email: string
  password: string
  name?: string | null
}

export type RequestPasswordResetInput = {
  email: string
  expiresInMs?: number
}

export type ConfirmPasswordResetInput = {
  token: string
  password: string
}

export type BootstrapFirstAdminInput = {
  email: string
  password: string
  name?: string | null
}

export type UpdateMyProfileInput = {
  name: string | null
  email: string
}

export type ChangeMyPasswordInput = {
  currentPassword: string
  newPassword: string
}

export type CreateTelegramLinkCodeInput = {
  expiresInMs?: number
}
