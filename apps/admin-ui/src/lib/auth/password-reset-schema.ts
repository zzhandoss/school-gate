import { z } from 'zod'

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Enter a valid email address')
})

export type RequestPasswordResetValues = z.infer<typeof requestPasswordResetSchema>

export const confirmPasswordResetSchema = z
  .object({
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  })

export type ConfirmPasswordResetValues = z.infer<typeof confirmPasswordResetSchema>
