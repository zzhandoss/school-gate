import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertsCreateRuleConfigFields } from './alerts-create-rule-config-fields'
import {
  buildAlertRuleConfig,
  getConfigHintKey,
  getRuleConfigDefaults
} from './alerts-create-rule-utils'
import type { AlertRule } from '@/lib/alerts/types'
import { updateAlertRule } from '@/lib/alerts/service'
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

type AlertsEditRuleFormProps = {
  rule: AlertRule
  onUpdated: () => Promise<void>
  onClose: () => void
}

export function AlertsEditRuleForm({ rule, onUpdated, onClose }: AlertsEditRuleFormProps) {
  const { t } = useTranslation()
  const defaults = useMemo(() => getRuleConfigDefaults(rule), [rule])
  const [name, setName] = useState(rule.name)
  const [severity, setSeverity] = useState<'warning' | 'critical'>(rule.severity)
  const [enabledValue, setEnabledValue] = useState<'true' | 'false'>(
    rule.isEnabled ? 'true' : 'false'
  )
  const [workerId, setWorkerId] = useState(defaults.workerId)
  const [outboxSource, setOutboxSource] = useState<'core' | 'device_service'>(defaults.outboxSource)
  const [outboxMaxNew, setOutboxMaxNew] = useState(defaults.outboxMaxNew)
  const [outboxMaxOldestAgeMs, setOutboxMaxOldestAgeMs] = useState(defaults.outboxMaxOldestAgeMs)
  const [accessEventMaxOldestAgeMs, setAccessEventMaxOldestAgeMs] = useState(defaults.accessEventMaxOldestAgeMs)
  const [errorSpikeSource, setErrorSpikeSource] = useState<'access_events' | 'outbox'>(defaults.errorSpikeSource)
  const [errorSpikeIncreaseBy, setErrorSpikeIncreaseBy] = useState(defaults.errorSpikeIncreaseBy)
  const [adapterId, setAdapterId] = useState(defaults.adapterId)
  const [adapterVendorKey, setAdapterVendorKey] = useState(defaults.adapterVendorKey)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('alerts.ruleForm.errors.ruleNameRequired'))
      return
    }

    const built = buildAlertRuleConfig({
      type: rule.type,
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

    setIsSubmitting(true)
    try {
      await updateAlertRule(rule.id, {
        name: trimmedName,
        severity,
        isEnabled: enabledValue === 'true',
        config: built.config
      })
      await onUpdated()
      onClose()
    } catch (value) {
      if (value instanceof ApiError) {
        setError(value.message || t('alerts.ruleForm.errors.updateFailed'))
      } else {
        setError(t('alerts.ruleForm.errors.updateFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`rule-name-${rule.id}`}>{t('alerts.ruleForm.ruleName')}</Label>
        <Input
          id={`rule-name-${rule.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.ruleType')}</Label>
          <Input value={t(`alerts.ruleTypes.${rule.type}`)} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.severity')}</Label>
          <Select value={severity} onValueChange={(value) => setSeverity(value as 'warning' | 'critical')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warning">{t('alerts.severity.warning')}</SelectItem>
              <SelectItem value="critical">{t('alerts.severity.critical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('alerts.ruleForm.status')}</Label>
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
        <p className="mt-1 text-xs text-muted-foreground">{t(getConfigHintKey(rule.type))}</p>
        <AlertsCreateRuleConfigFields
          type={rule.type}
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
          <AlertTitle>{t('alerts.ruleForm.cannotUpdateTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('alerts.ruleForm.saving') : t('profile.saveChanges')}
        </Button>
      </div>
    </form>
  )
}
