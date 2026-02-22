import { beforeAll, describe, expect, it } from 'vitest'

import { mapAuthErrorToMessage } from './error-messages'
import { i18n } from '@/lib/i18n'

describe('mapAuthErrorToMessage', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en')
  })

  it('returns mapped message for known error codes', () => {
    const result = mapAuthErrorToMessage(
      'admin_invite_expired',
      'fallback message'
    )
    expect(result).toBe('Invite has expired. Request a new one.')
  })

  it('returns fallback for unknown error codes', () => {
    const result = mapAuthErrorToMessage('unknown_code', 'fallback message')
    expect(result).toBe('fallback message')
  })

  it('returns mapped message for bootstrap conflict', () => {
    const result = mapAuthErrorToMessage(
      'first_admin_already_exists',
      'fallback message'
    )
    expect(result).toBe('System is already initialized. Use sign in instead.')
  })
})
