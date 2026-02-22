import { useState } from 'react'

import { changeMyPassword } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileChangePasswordForm() {
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
      setPasswordError('New password and confirmation do not match.')
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
      setPasswordSuccess('Password changed successfully.')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setPasswordError('Unexpected error while changing password.')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="mt-6 border-t border-border/70 pt-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Change password</p>
        <p className="text-xs text-muted-foreground">
          Enter current password, then new password with confirmation.
        </p>
      </div>
      <form className="mt-3 space-y-3" onSubmit={onChangePassword}>
        <div className="space-y-2">
          <Label htmlFor="profile-current-password">Current password</Label>
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
          <Label htmlFor="profile-new-password">New password</Label>
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
          <Label htmlFor="profile-confirm-password">Repeat new password</Label>
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
            <AlertTitle>Cannot change password</AlertTitle>
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        ) : null}
        {passwordSuccess ? (
          <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
            <AlertTitle>Password updated</AlertTitle>
            <AlertDescription>{passwordSuccess}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" variant="outline" disabled={isChangingPassword}>
          {isChangingPassword ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}
