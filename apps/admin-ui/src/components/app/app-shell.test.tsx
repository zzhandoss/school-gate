import { describe, expect, it } from 'vitest'

import {
  getAvatarInitials,
  getSidebarBrandingVariant
} from './app-shell.utils'

describe('AppShell', () => {
  it('returns full branding variant for expanded sidebar', () => {
    expect(getSidebarBrandingVariant(false)).toBe('full')
  })

  it('returns compact branding variant for collapsed sidebar', () => {
    expect(getSidebarBrandingVariant(true)).toBe('compact')
  })

  it('builds avatar initials from full name', () => {
    expect(getAvatarInitials('Admin User', 'admin@example.com')).toBe('AU')
  })

  it('falls back to email when name is missing', () => {
    expect(getAvatarInitials(null, 'admin@example.com')).toBe('AD')
  })
})
