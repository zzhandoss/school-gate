import { useMemo, useState } from 'react'
import { Save, Shield, UserRound } from 'lucide-react'

import { useSession } from '@/lib/auth/session-store'
import { updateMyProfile } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { ProfileChangePasswordForm } from './profile-change-password-form'
import { ProfileTelegramCard } from './profile-telegram-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileView() {
  const session = useSession()
  const [name, setName] = useState(session?.admin.name ?? '')
  const [email, setEmail] = useState(session?.admin.email ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const role = session?.admin.roleName ?? session?.admin.roleId ?? 'unknown'
  const status = session?.admin.status ?? 'pending'
  const normalizedName = useMemo(() => {
    const next = name.trim()
    return next.length === 0 ? null : next
  }, [name])

  async function onSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      await updateMyProfile({
        name: normalizedName,
        email: email.trim()
      })
      setSaveSuccess('Profile updated successfully.')
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setSaveError('Unexpected error while updating profile.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and Telegram linking for admin notifications.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" />
              Profile details
            </CardTitle>
            <CardDescription>
              Update your personal account information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSaveProfile}>
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your display name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-medium">{role}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium">{status}</p>
                </div>
              </div>

              {saveError ? (
                <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                  <AlertTitle>Cannot save profile</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              ) : null}
              {saveSuccess ? (
                <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
                  <AlertTitle>Saved</AlertTitle>
                  <AlertDescription>{saveSuccess}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
            <ProfileChangePasswordForm />
          </CardContent>
        </Card>

        <ProfileTelegramCard tgUserId={session?.admin.tgUserId} />
      </div>

      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <Shield className="h-3.5 w-3.5" />
          Security note
        </p>
        <p className="mt-1">
          Profile and password updates are performed via authenticated API endpoints for the current admin.
        </p>
      </div>
    </div>
  )
}
