import { describe, expect, it } from 'vitest'

import { getSidebarBrandingVariant } from './app-shell'

describe('AppShell', () => {
  it('returns full branding variant for expanded sidebar', () => {
    expect(getSidebarBrandingVariant(false)).toBe('full')
  })

  it('returns compact branding variant for collapsed sidebar', () => {
    expect(getSidebarBrandingVariant(true)).toBe('compact')
  })
})
