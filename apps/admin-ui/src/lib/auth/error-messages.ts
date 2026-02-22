import { i18n } from '@/lib/i18n'

const authErrorCodes = [
  'invalid_credentials',
  'current_password_invalid',
  'admin_disabled',
  'admin_invite_not_found',
  'admin_invite_expired',
  'admin_invite_used',
  'admin_invite_email_mismatch',
  'admin_email_exists',
  'role_not_found',
  'password_reset_not_found',
  'password_reset_expired',
  'password_reset_used',
  'admin_not_found',
  'admin_tg_not_linked',
  'admin_tg_link_expired',
  'admin_tg_link_used',
  'admin_tg_code_purpose_mismatch',
  'telegram_delivery_unavailable',
  'first_admin_already_exists',
  'server_unreachable'
] as const

const authErrorCodeSet = new Set<string>(authErrorCodes)

export function mapAuthErrorToMessage(code: string, fallback: string) {
  if (!authErrorCodeSet.has(code)) {
    return fallback
  }
  return i18n.t(`errors.${code}`, { defaultValue: fallback })
}
