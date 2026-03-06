import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck, ShieldQuestion } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { RequestPasswordResetValues } from '@/lib/auth/password-reset-schema'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { requestPasswordResetSchema } from '@/lib/auth/password-reset-schema'
import { requestPasswordReset } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function PasswordResetRequestCard() {
  const { t } = useTranslation()
  const router = useRouter()
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const form = useForm<RequestPasswordResetValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' }
  })

  const mutation = useMutation({
    mutationFn: async (values: RequestPasswordResetValues) => {
      return requestPasswordReset({
        email: values.email
      })
    },
    onSuccess: (data) => {
      setIssuedToken(data.token)
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
      }
    }
  })

  async function onSubmit(values: RequestPasswordResetValues) {
    await mutation.mutateAsync(values)
  }

  const errorMessage =
    mutation.error instanceof ApiError
      ? mapAuthErrorToMessage(mutation.error.code, mutation.error.message)
      : mutation.error instanceof Error
        ? mutation.error.message
        : null

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
            <h1 className="text-2xl font-semibold">{t('auth.passwordResetRequest.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.passwordResetRequest.subtitle')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('common.placeholders.email')}
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {translateValidationMessage(form.formState.errors.email.message)}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('auth.passwordResetRequest.requestFailedTitle')}</AlertTitle>
              <AlertDescription className="text-destructive/90">
                {errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t('auth.passwordResetRequest.sending') : t('auth.passwordResetRequest.send')}
          </Button>

          {mutation.isSuccess ? (
            <Alert
              role="status"
              aria-live="polite"
              className="border-emerald-300/60 bg-emerald-50 text-emerald-800"
            >
              <AlertTitle>{t('auth.passwordResetRequest.requestAcceptedTitle')}</AlertTitle>
              <AlertDescription>
                {t('auth.passwordResetRequest.requestAcceptedDescription')}
                {issuedToken ? (
                  <>
                    {' '}
                    {t('auth.passwordResetRequest.devTokenPrefix')}{' '}
                    <Link
                      to="/password-reset/confirm"
                      search={{ token: issuedToken }}
                      className="ml-1 underline underline-offset-2 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {t('auth.passwordResetRequest.openConfirmPage')}
                    </Link>
                    .
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            {t('auth.common.backToSignIn')}
          </Link>
        </form>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-teal-100 p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -top-24 -left-14 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
              <ShieldQuestion className="h-4 w-4" />
              {t('auth.passwordResetRequest.hero.recovery')}
            </span>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">{t('auth.passwordResetRequest.hero.title')}</h2>
            <p className="max-w-xs text-sm text-slate-700">
              {t('auth.passwordResetRequest.hero.description')}
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600">
              <MailCheck className="h-4 w-4 text-emerald-600" />
              {t('auth.passwordResetRequest.hero.emailHint')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
