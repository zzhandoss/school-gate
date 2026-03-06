import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { changeMyPassword } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileChangePasswordForm() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('profile.password.errors.mismatch'))
      setIsChangingPassword(false)
      return
    }

    try {
      await changeMyPassword({
        currentPassword,
        newPassword
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordSuccess(t('profile.password.success.changed'))
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setPasswordError(t('profile.password.errors.unexpectedChange'))
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="mt-6 border-t border-border/70 pt-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{t('profile.password.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('profile.password.description')}
        </p>
      </div>
      <form className="mt-3 space-y-3" onSubmit={onChangePassword}>
        <div className="space-y-2">
          <Label htmlFor="profile-current-password">{t('profile.password.current')}</Label>
          <Input
            id="profile-current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-new-password">{t('profile.password.new')}</Label>
          <Input
            id="profile-new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-confirm-password">{t('profile.password.confirm')}</Label>
          <Input
            id="profile-confirm-password"
            type="password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {passwordError ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>{t('profile.password.cannotChangeTitle')}</AlertTitle>
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        ) : null}
        {passwordSuccess ? (
          <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
            <AlertTitle>{t('profile.password.updatedTitle')}</AlertTitle>
            <AlertDescription>{passwordSuccess}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" variant="outline" disabled={isChangingPassword}>
          {isChangingPassword ? t('profile.password.updating') : t('profile.password.update')}
        </Button>
      </form>
    </div>
  )
}
