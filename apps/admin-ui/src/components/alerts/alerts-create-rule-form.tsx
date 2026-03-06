import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertsCreateRuleConfigFields } from './alerts-create-rule-config-fields'
import { buildAlertRuleConfig, getConfigHintKey } from './alerts-create-rule-utils'
import type { AlertRuleType, CreateAlertRuleInput } from '@/lib/alerts/types'
import { createAlertRule } from '@/lib/alerts/service'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type AlertsCreateRuleFormProps = {
  onCreated: () => Promise<void>
  onClose: () => void
}

const alertTypeOptions: Array<AlertRuleType> = [
  'worker_stale',
  'outbox_backlog',
  'bot_down',
  'access_event_lag',
  'error_spike',
  'device_service_down',
  'adapter_down'
]

export function AlertsCreateRuleForm({ onCreated, onClose }: AlertsCreateRuleFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState<AlertRuleType>('worker_stale')
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning')
  const [enabledValue, setEnabledValue] = useState<'true' | 'false'>('true')
  const [workerId, setWorkerId] = useState('')
  const [outboxSource, setOutboxSource] = useState<'core' | 'device_service'>('core')
  const [outboxMaxNew, setOutboxMaxNew] = useState('')
  const [outboxMaxOldestAgeMs, setOutboxMaxOldestAgeMs] = useState('')
  const [accessEventMaxOldestAgeMs, setAccessEventMaxOldestAgeMs] = useState('')
  const [errorSpikeSource, setErrorSpikeSource] = useState<'access_events' | 'outbox'>('access_events')
  const [errorSpikeIncreaseBy, setErrorSpikeIncreaseBy] = useState('')
  const [adapterId, setAdapterId] = useState('')
  const [adapterVendorKey, setAdapterVendorKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const configHint = useMemo(
    () => t(getConfigHintKey(type)),
    [type, t]
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('alerts.ruleForm.errors.ruleNameRequired'))
      return
    }

    const built = buildAlertRuleConfig({
      type,
      workerId,
      outboxSource,
      outboxMaxNew,
      outboxMaxOldestAgeMs,
      accessEventMaxOldestAgeMs,
      errorSpikeSource,
      errorSpikeIncreaseBy,
      adapterId,
      adapterVendorKey
    })
    if ('errorKey' in built) {
      setError(t(built.errorKey))
      return
    }

    const payload: CreateAlertRuleInput = {
      name: trimmedName,
      type,
      severity,
      isEnabled: enabledValue === 'true',
      config: built.config
    }

    setIsSubmitting(true)
    try {
      await createAlertRule(payload)
      await onCreated()
      onClose()
    } catch (value) {
      if (value instanceof ApiError) {
        setError(value.message || t('alerts.ruleForm.errors.createFailed'))
      } else {
        setError(t('alerts.ruleForm.errors.createFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="rule-name">{t('alerts.ruleForm.ruleName')}</Label>
        <Input
          id="rule-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('alerts.ruleForm.placeholders.ruleName')}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.ruleType')}</Label>
          <Select value={type} onValueChange={(value) => setType(value as AlertRuleType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('alerts.ruleForm.placeholders.selectRuleType')} />
            </SelectTrigger>
            <SelectContent>
              {alertTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`alerts.ruleTypes.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.severity')}</Label>
          <Select value={severity} onValueChange={(value) => setSeverity(value as 'warning' | 'critical')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('alerts.ruleForm.placeholders.selectSeverity')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warning">{t('alerts.severity.warning')}</SelectItem>
              <SelectItem value="critical">{t('alerts.severity.critical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('alerts.ruleForm.initialStatus')}</Label>
        <Select value={enabledValue} onValueChange={(value) => setEnabledValue(value as 'true' | 'false')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t('settings.enabled')}</SelectItem>
            <SelectItem value="false">{t('settings.disabled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-xs font-medium text-foreground">{t('alerts.ruleForm.config')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{configHint}</p>
        <AlertsCreateRuleConfigFields
          type={type}
          workerId={workerId}
          outboxSource={outboxSource}
          outboxMaxNew={outboxMaxNew}
          outboxMaxOldestAgeMs={outboxMaxOldestAgeMs}
          accessEventMaxOldestAgeMs={accessEventMaxOldestAgeMs}
          errorSpikeSource={errorSpikeSource}
          errorSpikeIncreaseBy={errorSpikeIncreaseBy}
          adapterId={adapterId}
          adapterVendorKey={adapterVendorKey}
          setWorkerId={setWorkerId}
          setOutboxSource={setOutboxSource}
          setOutboxMaxNew={setOutboxMaxNew}
          setOutboxMaxOldestAgeMs={setOutboxMaxOldestAgeMs}
          setAccessEventMaxOldestAgeMs={setAccessEventMaxOldestAgeMs}
          setErrorSpikeSource={setErrorSpikeSource}
          setErrorSpikeIncreaseBy={setErrorSpikeIncreaseBy}
          setAdapterId={setAdapterId}
          setAdapterVendorKey={setAdapterVendorKey}
        />
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('alerts.ruleForm.cannotCreateTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.actions.creating') : t('alerts.ruleForm.createRule')}
        </Button>
      </div>
    </form>
  )
}
