import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import {
  login,
  loginWithTelegramCode,
  requestTelegramLoginCode
} from '@/lib/auth/service'
import {
  requestTelegramLoginCodeSchema,
  telegramOtpLoginSchema
} from '@/lib/auth/telegram-login-schema'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTP } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type AuthMethod = 'password' | 'telegram'
export function LoginCard() {
  const router = useRouter()
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telegramCode, setTelegramCode] = useState('')
  const [telegramStep, setTelegramStep] = useState<'request' | 'verify'>('request')
  const [telegramExpiresAt, setTelegramExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setNotice(null)

    try {
      await login({ email, password })
      await router.navigate({ to: '/dashboard' })
    } catch (value) {
      if (value instanceof ApiError) {
        if (value.code === 'server_unreachable') {
          await router.navigate({ to: '/unavailable' })
          return
        }
        setError(mapAuthErrorToMessage(value.code, value.message))
      } else {
        setError('Unexpected error during login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function requestTelegramCode() {
    setIsLoading(true)
    setError(null)
    setNotice(null)

    const parsed = requestTelegramLoginCodeSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email is invalid')
      setIsLoading(false)
      return
    }
    try {
      const result = await requestTelegramLoginCode({ email: parsed.data.email })
      setTelegramStep('verify')
      setTelegramCode('')
      setTelegramExpiresAt(result.expiresAt)
      setNotice('Code sent to linked Telegram. Enter 6 digits to continue.')
    } catch (value) {
      if (value instanceof ApiError) {
        if (value.code === 'server_unreachable') {
          await router.navigate({ to: '/unavailable' })
          return
        }
        setError(mapAuthErrorToMessage(value.code, value.message))
      } else {
        setError('Unexpected error while requesting Telegram code')
      }
    } finally {
      setIsLoading(false)
    }
  }
  async function onSendTelegramCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await requestTelegramCode()
  }

  async function onTelegramLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setNotice(null)

    const parsed = telegramOtpLoginSchema.safeParse({ email, code: telegramCode })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Code is invalid')
      setIsLoading(false)
      return
    }
    try {
      await loginWithTelegramCode(parsed.data)
      await router.navigate({ to: '/dashboard' })
    } catch (value) {
      if (value instanceof ApiError) {
        if (value.code === 'server_unreachable') {
          await router.navigate({ to: '/unavailable' })
          return
        }
        setError(mapAuthErrorToMessage(value.code, value.message))
      } else {
        setError('Unexpected error during Telegram login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-lg shadow-slate-900/10">
      <CardContent className="grid p-0 md:grid-cols-2">
        <div className="space-y-5 p-6 md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              School Gate
            </p>
            <h1 className="text-2xl font-semibold">Admin sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use password or Telegram OTP to open the operations dashboard.
            </p>
          </div>
          <Tabs
            value={method}
            onValueChange={(next) => {
              const nextMethod = next === 'telegram' ? 'telegram' : 'password'
              setMethod(nextMethod)
              setError(null)
              setNotice(null)
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="space-y-5 pt-4">
              <form className="space-y-5" onSubmit={onPasswordSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/password-reset/request"
                      className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="telegram" className="space-y-4 pt-4">
              {telegramStep === 'request' ? (
                <form className="space-y-4" onSubmit={onSendTelegramCode}>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-email">Email</Label>
                    <Input
                      id="telegram-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending code...' : 'Send code to Telegram'}
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={onTelegramLoginSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-code">6-digit code</Label>
                    <InputOTP
                      id="telegram-code"
                      value={telegramCode}
                      onChange={setTelegramCode}
                      disabled={isLoading}
                    />
                    {telegramExpiresAt ? (
                      <p className="text-xs text-muted-foreground">
                        Code expires at {new Date(telegramExpiresAt).toLocaleTimeString()}.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={() => {
                        setTelegramStep('request')
                        setTelegramCode('')
                        setTelegramExpiresAt(null)
                        setError(null)
                        setNotice(null)
                      }}
                    >
                      Change email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={() => void requestTelegramCode()}
                    >
                      Resend code
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Sign in'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
          {notice ? (
            <Alert>
              <AlertTitle>Telegram login</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription className="text-destructive/90">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-amber-100 via-white to-cyan-100 p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -top-24 -left-14 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              Protected admin access
            </span>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              Operations center for School Gate
            </h2>
            <p className="max-w-xs text-sm text-slate-700">
              Monitor workers, queues, and incoming subscription requests from
              one control panel.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
