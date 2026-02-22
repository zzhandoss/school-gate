import { useMemo, useState } from 'react'

import { AlertsCreateRuleConfigFields } from './alerts-create-rule-config-fields'
import { buildAlertRuleConfig, getConfigHint } from './alerts-create-rule-utils'
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

const alertTypeOptions: Array<{ value: AlertRuleType; label: string }> = [
  { value: 'worker_stale', label: 'Worker stale' },
  { value: 'outbox_backlog', label: 'Outbox backlog' },
  { value: 'bot_down', label: 'Bot down' },
  { value: 'access_event_lag', label: 'Access event lag' },
  { value: 'error_spike', label: 'Error spike' },
  { value: 'device_service_down', label: 'Device service down' },
  { value: 'adapter_down', label: 'Adapter down' }
]

export function AlertsCreateRuleForm({ onCreated, onClose }: AlertsCreateRuleFormProps) {
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

  const configHint = useMemo(() => getConfigHint(type), [type])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Rule name is required.')
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
    if ('error' in built) {
      setError(built.error ?? 'Invalid rule config.')
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
        setError(value.message || 'Failed to create alert rule.')
      } else {
        setError('Failed to create alert rule.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 p-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="rule-name">Rule name</Label>
        <Input
          id="rule-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="High outbox backlog"
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Rule type</Label>
          <Select value={type} onValueChange={(value) => setType(value as AlertRuleType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select rule type" />
            </SelectTrigger>
            <SelectContent>
              {alertTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={(value) => setSeverity(value as 'warning' | 'critical')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warning">warning</SelectItem>
              <SelectItem value="critical">critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Initial status</Label>
        <Select value={enabledValue} onValueChange={(value) => setEnabledValue(value as 'true' | 'false')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">enabled</SelectItem>
            <SelectItem value="false">disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-xs font-medium text-foreground">Config</p>
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
          <AlertTitle>Cannot create rule</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create rule'}
        </Button>
      </div>
    </form>
  )
}
