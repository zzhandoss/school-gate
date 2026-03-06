import { useTranslation } from 'react-i18next'
import type { AlertRuleType } from '@/lib/alerts/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type AlertsCreateRuleConfigFieldsProps = {
  type: AlertRuleType
  workerId: string
  outboxSource: 'core' | 'device_service'
  outboxMaxNew: string
  outboxMaxOldestAgeMs: string
  accessEventMaxOldestAgeMs: string
  errorSpikeSource: 'access_events' | 'outbox'
  errorSpikeIncreaseBy: string
  adapterId: string
  adapterVendorKey: string
  setWorkerId: (value: string) => void
  setOutboxSource: (value: 'core' | 'device_service') => void
  setOutboxMaxNew: (value: string) => void
  setOutboxMaxOldestAgeMs: (value: string) => void
  setAccessEventMaxOldestAgeMs: (value: string) => void
  setErrorSpikeSource: (value: 'access_events' | 'outbox') => void
  setErrorSpikeIncreaseBy: (value: string) => void
  setAdapterId: (value: string) => void
  setAdapterVendorKey: (value: string) => void
}

export function AlertsCreateRuleConfigFields(props: AlertsCreateRuleConfigFieldsProps) {
  const { t } = useTranslation()
  const {
    type,
    workerId,
    outboxSource,
    outboxMaxNew,
    outboxMaxOldestAgeMs,
    accessEventMaxOldestAgeMs,
    errorSpikeSource,
    errorSpikeIncreaseBy,
    adapterId,
    adapterVendorKey,
    setWorkerId,
    setOutboxSource,
    setOutboxMaxNew,
    setOutboxMaxOldestAgeMs,
    setAccessEventMaxOldestAgeMs,
    setErrorSpikeSource,
    setErrorSpikeIncreaseBy,
    setAdapterId,
    setAdapterVendorKey
  } = props

  if (type === 'worker_stale') {
    return (
      <div className="mt-3 space-y-2">
        <Label htmlFor="worker-id">{t('alerts.ruleForm.configFields.workerIdOptional')}</Label>
        <Input
          id="worker-id"
          value={workerId}
          onChange={(event) => setWorkerId(event.target.value)}
          placeholder={t('alerts.ruleForm.configFields.placeholders.workerId')}
        />
      </div>
    )
  }

  if (type === 'outbox_backlog') {
    return (
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.configFields.source')}</Label>
          <Select value={outboxSource} onValueChange={(value) => setOutboxSource(value as 'core' | 'device_service')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="core">{t('alerts.ruleForm.configFields.sources.core')}</SelectItem>
              <SelectItem value="device_service">{t('alerts.ruleForm.configFields.sources.deviceService')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="outbox-max-new">{t('alerts.ruleForm.configFields.maxNew')}</Label>
            <Input
              id="outbox-max-new"
              type="number"
              min={1}
              value={outboxMaxNew}
              onChange={(event) => setOutboxMaxNew(event.target.value)}
              placeholder={t('alerts.ruleForm.configFields.placeholders.maxNew')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outbox-max-age">{t('alerts.ruleForm.configFields.maxOldestAgeMs')}</Label>
            <Input
              id="outbox-max-age"
              type="number"
              min={1}
              value={outboxMaxOldestAgeMs}
              onChange={(event) => setOutboxMaxOldestAgeMs(event.target.value)}
              placeholder={t('alerts.ruleForm.configFields.placeholders.maxOldestAgeMsOutbox')}
            />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'access_event_lag') {
    return (
      <div className="mt-3 space-y-2">
        <Label htmlFor="access-lag-max-age">{t('alerts.ruleForm.configFields.maxOldestAgeMs')}</Label>
        <Input
          id="access-lag-max-age"
          type="number"
          min={1}
          value={accessEventMaxOldestAgeMs}
          onChange={(event) => setAccessEventMaxOldestAgeMs(event.target.value)}
          placeholder={t('alerts.ruleForm.configFields.placeholders.maxOldestAgeMsAccessEvents')}
          required
        />
      </div>
    )
  }

  if (type === 'error_spike') {
    return (
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>{t('alerts.ruleForm.configFields.source')}</Label>
          <Select value={errorSpikeSource} onValueChange={(value) => setErrorSpikeSource(value as 'access_events' | 'outbox')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="access_events">{t('alerts.ruleForm.configFields.sources.accessEvents')}</SelectItem>
              <SelectItem value="outbox">{t('alerts.ruleForm.configFields.sources.outbox')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="error-spike-increase">{t('alerts.ruleForm.configFields.increaseBy')}</Label>
          <Input
            id="error-spike-increase"
            type="number"
            min={1}
            value={errorSpikeIncreaseBy}
            onChange={(event) => setErrorSpikeIncreaseBy(event.target.value)}
            placeholder={t('alerts.ruleForm.configFields.placeholders.increaseBy')}
            required
          />
        </div>
      </div>
    )
  }

  if (type === 'adapter_down') {
    return (
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adapter-id">{t('alerts.ruleForm.configFields.adapterIdOptional')}</Label>
          <Input
            id="adapter-id"
            value={adapterId}
            onChange={(event) => setAdapterId(event.target.value)}
            placeholder={t('alerts.ruleForm.configFields.placeholders.adapterId')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adapter-vendor-key">{t('alerts.ruleForm.configFields.vendorKeyOptional')}</Label>
          <Input
            id="adapter-vendor-key"
            value={adapterVendorKey}
            onChange={(event) => setAdapterVendorKey(event.target.value)}
            placeholder={t('alerts.ruleForm.configFields.placeholders.vendorKey')}
          />
        </div>
      </div>
    )
  }

  return null
}
