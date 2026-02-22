import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, KeyRound, UserRoundPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { InviteRegistrationValues } from '@/lib/auth/invite-schema'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { acceptInviteAndLogin } from '@/lib/auth/service'
import { inviteRegistrationSchema } from '@/lib/auth/invite-schema'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type InviteCardProps = {
  token: string | null
}

export function InviteCard({ token }: InviteCardProps) {
  const router = useRouter()
  const form = useForm<InviteRegistrationValues>({
    resolver: zodResolver(inviteRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    }
  })

  const mutation = useMutation({
    mutationFn: async (values: InviteRegistrationValues) => {
      if (!token) {
        throw new ApiError(400, {
          code: 'admin_invite_not_found',
          message: 'Invite token is missing'
        })
      }
      await acceptInviteAndLogin({
        token,
        email: values.email,
        password: values.password,
        name: values.name?.trim() ? values.name : null
      })
    },
    onSuccess: async () => {
      await router.navigate({ to: '/dashboard' })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
      }
    }
  })

  async function onSubmit(values: InviteRegistrationValues) {
    await mutation.mutateAsync(values)
  }

  const apiErrorMessage =
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
            <h1 className="text-2xl font-semibold">Invite link is missing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The invite token was not found in this URL. Ask your administrator
              for a new invite link.
            </p>
          </div>
          <Link
            to="/login"
            className={cn(buttonVariants({ variant: 'default' }), 'w-full')}
          >
            Go to sign in
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
            <h1 className="text-2xl font-semibold">Complete invite registration</h1>
            <p className="text-sm text-muted-foreground">
              Finish account setup and continue directly to the dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com…"
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
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
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          {apiErrorMessage ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>Registration failed</AlertTitle>
              <AlertDescription className="text-destructive/90">
                {apiErrorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Completing registration…' : 'Complete registration'}
          </Button>
        </form>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-100 via-white to-amber-100 p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -top-24 -left-14 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
              <UserRoundPlus className="h-4 w-4" />
              Invite onboarding
            </span>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              One step left to access the admin console
            </h2>
            <p className="max-w-xs text-sm text-slate-700">
              After registration, the system signs you in automatically and opens
              the dashboard.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Invite token already validated on submit
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
