import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { ConfirmPasswordResetValues } from '@/lib/auth/password-reset-schema'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { confirmPasswordResetSchema } from '@/lib/auth/password-reset-schema'
import { confirmPasswordReset } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type PasswordResetConfirmCardProps = {
  token: string | null
}

export function PasswordResetConfirmCard({ token }: PasswordResetConfirmCardProps) {
  const router = useRouter()
  const form = useForm<ConfirmPasswordResetValues>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const mutation = useMutation({
    mutationFn: async (values: ConfirmPasswordResetValues) => {
      if (!token) {
        throw new ApiError(400, {
          code: 'password_reset_not_found',
          message: 'Reset token is missing'
        })
      }
      return confirmPasswordReset({
        token,
        password: values.password
      })
    },
    onSuccess: async () => {
      await router.navigate({ to: '/login' })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
      }
    }
  })

  async function onSubmit(values: ConfirmPasswordResetValues) {
    await mutation.mutateAsync(values)
  }

  const errorMessage =
    mutation.error instanceof ApiError
      ? mapAuthErrorToMessage(mutation.error.code, mutation.error.message)
      : mutation.error instanceof Error
        ? mutation.error.message
        : null

  if (!token) {
    return (
      <Card className="border-border/80 shadow-lg shadow-slate-900/10">
        <CardContent className="space-y-4 p-6 md:p-8">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Reset token is missing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Open this page from a valid reset link or request a new password
              reset token.
            </p>
          </div>
          <Link
            to="/password-reset/request"
            className={cn(buttonVariants({ variant: 'default' }), 'w-full')}
          >
            Request new reset token
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-lg shadow-slate-900/10">
      <CardContent className="grid p-0 md:grid-cols-2">
        <form className="space-y-4 p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              School Gate
            </p>
            <h1 className="text-2xl font-semibold">Set a new password</h1>
            <p className="text-sm text-muted-foreground">
              Choose your new admin password and sign in again.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              name="new-password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>Password reset failed</AlertTitle>
              <AlertDescription className="text-destructive/90">
                {errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving new password…' : 'Set new password'}
          </Button>

          <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            Back to sign in
          </Link>
        </form>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-100 via-white to-cyan-100 p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -top-24 -left-14 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
              <KeyRound className="h-4 w-4" />
              Secure reset
            </span>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              Password changed immediately
            </h2>
            <p className="max-w-xs text-sm text-slate-700">
              After successful reset you can sign in with the new password.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              One-time token protection
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
