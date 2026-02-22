import { describe, expect, it } from 'vitest'

import { bootstrapFirstAdminSchema } from './first-admin-schema'

describe('bootstrapFirstAdminSchema', () => {
  it('accepts valid bootstrap payload', () => {
    const result = bootstrapFirstAdminSchema.safeParse({
      email: 'root@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: 'Root Admin'
    })

    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = bootstrapFirstAdminSchema.safeParse({
      email: 'root@example.com',
      password: 'password123',
      confirmPassword: 'pass123'
    })

    expect(result.success).toBe(false)
  })
})
