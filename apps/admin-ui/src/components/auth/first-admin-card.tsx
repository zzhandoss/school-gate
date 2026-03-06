import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { BootstrapFirstAdminValues } from '@/lib/auth/first-admin-schema'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { bootstrapFirstAdminAndLogin } from '@/lib/auth/service'
import { bootstrapFirstAdminSchema } from '@/lib/auth/first-admin-schema'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FirstAdminCard() {
  const { t } = useTranslation()
  const router = useRouter()
  const form = useForm<BootstrapFirstAdminValues>({
    resolver: zodResolver(bootstrapFirstAdminSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    }
  })

  const mutation = useMutation({
    mutationFn: async (values: BootstrapFirstAdminValues) => {
      await bootstrapFirstAdminAndLogin({
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

  async function onSubmit(values: BootstrapFirstAdminValues) {
    await mutation.mutateAsync(values)
  }

  const apiErrorMessage =
    mutation.error instanceof ApiError
      ? mapAuthErrorToMessage(mutation.error.code, mutation.error.message)
      : mutation.error instanceof Error
        ? mutation.error.message
        : null

  const alreadyInitialized = mutation.error instanceof ApiError &&
    mutation.error.code === 'first_admin_already_exists'

  function translateValidationMessage(message: string | undefined) {
    if (!message) {
      return ''
    }
    return t(message, { defaultValue: message })
  }

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-lg shadow-slate-900/10">
      <CardContent className="grid p-0 md:grid-cols-2">
        <form className="space-y-4 p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              {t('app.brand.schoolGate')}
            </p>
            <h1 className="text-2xl font-semibold">{t('auth.firstAdmin.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.firstAdmin.subtitle')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.firstAdmin.placeholders.email')}
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {translateValidationMessage(form.formState.errors.email.message)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.common.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {translateValidationMessage(form.formState.errors.password.message)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.common.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {translateValidationMessage(form.formState.errors.confirmPassword.message)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.common.nameOptional')}</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {translateValidationMessage(form.formState.errors.name.message)}
              </p>
            ) : null}
          </div>

          {apiErrorMessage ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('auth.firstAdmin.bootstrapFailedTitle')}</AlertTitle>
              <AlertDescription className="text-destructive/90">
                {apiErrorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t('auth.firstAdmin.creating') : t('auth.firstAdmin.create')}
          </Button>

          {alreadyInitialized ? (
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              {t('auth.common.goToSignIn')}
            </Link>
          ) : null}
        </form>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-amber-100 p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -top-24 -left-14 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
              <UserRoundPlus className="h-4 w-4" />
              {t('auth.firstAdmin.hero.oneTimeSetup')}
            </span>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t('auth.firstAdmin.hero.title')}
            </h2>
            <p className="max-w-xs text-sm text-slate-700">
              {t('auth.firstAdmin.hero.description')}
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t('auth.firstAdmin.hero.emptySystemsOnly')}
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600">
              <KeyRound className="h-4 w-4 text-slate-600" />
              {t('auth.firstAdmin.hero.strongCredentials')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
