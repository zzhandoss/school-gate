import { clearSession, getSession, setSession } from './session-store'
import { resolveSessionServerFn } from './session.server'
import { mapSessionPayload } from './session-mapper'
import type { AuthSessionPayload } from './session-mapper'
import type {
  AcceptInviteInput,
  BootstrapFirstAdminInput,
  ConfirmPasswordResetInput,
  CreateTelegramLinkCodeInput,
  LoginInput,
  RequestPasswordResetInput,
  RequestTelegramLoginCodeInput,
  SessionState,
  TelegramOtpLoginInput,
  ChangeMyPasswordInput,
  UpdateMyProfileInput
} from './types'
import { requestApi } from '@/lib/api/client'
import { ApiError } from '@/lib/api/types'

type AcceptInviteResponse = {
  adminId: string
  roleId: string
}
type RequestPasswordResetResponse = {
  token: string | null
}
type ConfirmPasswordResetResponse = {
  adminId: string
}
type BootstrapFirstAdminResponse = {
  adminId: string
  roleId: string
}
type TelegramLinkCodeResponse = {
  code: string
  expiresAt: string
}
type RequestTelegramLoginCodeResponse = {
  sent: true
  expiresAt: string
}
type UnlinkTelegramResponse = {
  adminId: string
}
type ChangeMyPasswordResponse = {
  adminId: string
}

export async function login(input: LoginInput) {
  const payload = await requestApi<AuthSessionPayload>('/api/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true
  })
  const session = mapSessionPayload(payload)
  setSession(session)
  return session
}

export async function requestTelegramLoginCode(
  input: RequestTelegramLoginCodeInput
) {
  return requestApi<RequestTelegramLoginCodeResponse>(
    '/api/auth/telegram/login-code',
    {
      method: 'POST',
      body: {
        email: input.email,
        expiresInMs: input.expiresInMs ?? 5 * 60 * 1000
      },
      skipAuth: true
    }
  )
}

export async function loginWithTelegramCode(input: TelegramOtpLoginInput) {
  const payload = await requestApi<AuthSessionPayload>('/api/auth/telegram/login', {
    method: 'POST',
    body: {
      email: input.email,
      code: input.code
    },
    skipAuth: true
  })
  const session = mapSessionPayload(payload)
  setSession(session)
  return session
}

export async function acceptInvite(input: AcceptInviteInput) {
  return requestApi<AcceptInviteResponse>('/api/auth/invites/accept', {
    method: 'POST',
    body: {
      token: input.token,
      email: input.email,
      password: input.password,
      name: input.name ?? null
    },
    skipAuth: true
  })
}

export async function acceptInviteAndLogin(input: AcceptInviteInput) {
  await acceptInvite(input)
  return login({ email: input.email, password: input.password })
}

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  return requestApi<RequestPasswordResetResponse>('/api/auth/password-resets/request', {
    method: 'POST',
    body: {
      email: input.email,
      expiresInMs: input.expiresInMs ?? 10 * 60 * 1000
    },
    skipAuth: true
  })
}

export async function confirmPasswordReset(input: ConfirmPasswordResetInput) {
  return requestApi<ConfirmPasswordResetResponse>('/api/auth/password-resets/confirm', {
    method: 'POST',
    body: {
      token: input.token,
      password: input.password
    },
    skipAuth: true
  })
}

export async function bootstrapFirstAdmin(input: BootstrapFirstAdminInput) {
  return requestApi<BootstrapFirstAdminResponse>('/api/auth/bootstrap/first-admin', {
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
      name: input.name ?? null
    },
    skipAuth: true
  })
}

export async function bootstrapFirstAdminAndLogin(input: BootstrapFirstAdminInput) {
  await bootstrapFirstAdmin(input)
  return login({ email: input.email, password: input.password })
}

export async function updateMyProfile(input: UpdateMyProfileInput) {
  const payload = await requestApi<AuthSessionPayload>('/api/me', {
    method: 'PATCH',
    body: {
      name: input.name,
      email: input.email
    }
  })
  const next = mapSessionPayload(payload, getSession())
  setSession(next)
  return next
}

export async function changeMyPassword(input: ChangeMyPasswordInput) {
  return requestApi<ChangeMyPasswordResponse>('/api/auth/me/password', {
    method: 'PATCH',
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword
    }
  })
}

export async function createTelegramLinkCode(input: CreateTelegramLinkCodeInput = {}) {
  return requestApi<TelegramLinkCodeResponse>('/api/auth/telegram/link-code', {
    method: 'POST',
    body: {
      expiresInMs: input.expiresInMs ?? 5 * 60 * 1000
    }
  })
}

export async function unlinkTelegram() {
  const result = await requestApi<UnlinkTelegramResponse>('/api/auth/telegram/unlink', {
    method: 'POST',
    body: {}
  })
  const current = getSession()
  if (current) {
    setSession({
      ...current,
      admin: {
        ...current.admin,
        tgUserId: null
      }
    })
  }
  return result
}

export async function logout() {
  logoutInFlight = true
  resolveSessionInFlight = null
  try {
    await requestApi('/api/auth/logout', {
      method: 'POST',
      body: {},
      skipAuth: true
    })
  } catch {
    // Local session still must be cleared even if backend is unavailable.
  } finally {
    logoutInFlight = false
  }
  clearSession()
}

export function ensureActiveSession() {
  return getSession()
}

let resolveSessionInFlight: Promise<SessionState | null> | null = null
let logoutInFlight = false

export async function resolveSession() {
  if (logoutInFlight) {
    clearSession()
    return null
  }

  const existing = getSession()
  if (existing) {
    return existing
  }

  if (!resolveSessionInFlight) {
    resolveSessionInFlight = resolveSessionServerFn()
      .then((result) => {
        if (logoutInFlight) {
          clearSession()
          return null
        }

        if (!result.session) {
          clearSession()
          return null
        }

        const next = result.session
        setSession(next)
        return next
      })
      .finally(() => {
        resolveSessionInFlight = null
      })
  }

  return resolveSessionInFlight
}

export async function ensureSession() {
  try {
    return await resolveSession()
  } catch (error) {
    if (error instanceof ApiError && error.code === 'server_unreachable') {
      clearSession()
    }
    return null
  }
}
