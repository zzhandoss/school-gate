import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { findIdentityInDevice } from '@/lib/persons/service'
import type { PersonIdentityItem, UpsertPersonIdentityInput } from '@/lib/persons/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type IdentityDeviceOption = {
  deviceId: string
  name: string
}

type PersonIdentityFormProps = {
  mode: 'create' | 'edit'
  identity?: PersonIdentityItem
  personIin?: string
  devices: Array<IdentityDeviceOption>
  canWrite: boolean
  onSubmit: (input: UpsertPersonIdentityInput) => Promise<void>
  onClose: () => void
}

export function PersonIdentityForm({ mode, identity, personIin, devices, canWrite, onSubmit, onClose }: PersonIdentityFormProps) {
  const { t } = useTranslation()
  const [deviceId, setDeviceId] = useState(identity?.deviceId ?? '')
  const [terminalPersonId, setTerminalPersonId] = useState(identity?.terminalPersonId ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  const [autoMessage, setAutoMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canAutoFind = mode === 'create' && /^\d{12}$/.test(personIin ?? '') && Boolean(deviceId.trim()) && !isSubmitting && !isAutoLoading
  const deviceOptions = useMemo(() => {
    if (!identity?.deviceId || devices.some((device) => device.deviceId === identity.deviceId)) {
      return devices
    }
    return [{ deviceId: identity.deviceId, name: identity.deviceId }, ...devices]
  }, [devices, identity?.deviceId])

  const canSubmit = useMemo(() => {
    if (!canWrite || isSubmitting) {
      return false
    }
    if (deviceOptions.length === 0) {
      return false
    }
    return Boolean(deviceId.trim() && terminalPersonId.trim())
  }, [canWrite, deviceId, deviceOptions.length, isSubmitting, terminalPersonId])

  async function handleAutoFind() {
    if (!canAutoFind || !personIin) {
      return
    }

    setError(null)
    setAutoMessage(null)
    setIsAutoLoading(true)
    try {
      const result = await findIdentityInDevice({
        deviceId: deviceId.trim(),
        identityKey: 'iin',
        identityValue: personIin
      })
      const first = result.matches[0]
      if (!first) {
        setAutoMessage(t('persons.identityForm.autoNoMatch'))
        return
      }
      setTerminalPersonId(first.terminalPersonId)
      const details = [first.displayName, first.source].filter(Boolean).join(', ')
      setAutoMessage(details
        ? t('persons.identityForm.autoFoundWithDetails', { id: first.terminalPersonId, details })
        : t('persons.identityForm.autoFound', { id: first.terminalPersonId }))
    } catch (value) {
      setError(value instanceof Error ? value.message : t('persons.identityForm.autoFindFailed'))
    } finally {
      setIsAutoLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        deviceId: deviceId.trim(),
        terminalPersonId: terminalPersonId.trim()
      })
      onClose()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('persons.identityForm.operationFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 px-4 pb-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('persons.identityForm.cannotSaveTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label>{t('common.labels.device')}</Label>
        <Select
          value={deviceId}
          onValueChange={setDeviceId}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={deviceOptions.length > 0
              ? t('persons.identityForm.placeholders.selectDevice')
              : t('persons.identityForm.placeholders.noDevicesAvailable')}
            />
          </SelectTrigger>
          <SelectContent>
            {deviceOptions.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.name} ({device.deviceId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {deviceOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('persons.identityForm.noDevicesHint')}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="identity-terminal-id">{t('persons.terminalPersonId')}</Label>
        <Input
          id="identity-terminal-id"
          value={terminalPersonId}
          disabled={isSubmitting}
          onChange={(event) => setTerminalPersonId(event.target.value)}
          placeholder={t('persons.identityForm.placeholders.terminalPersonId')}
        />
        {mode === 'create' ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={!canAutoFind} onClick={() => void handleAutoFind()}>
              {isAutoLoading ? t('persons.identityForm.autoFinding') : t('persons.identityForm.autoFindInDevice')}
            </Button>
            {autoMessage ? <span className="text-xs text-muted-foreground">{autoMessage}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting
            ? t('settings.saving')
            : mode === 'create'
              ? t('persons.identityForm.addIdentity')
              : t('profile.saveChanges')}
        </Button>
      </div>
    </form>
  )
}
