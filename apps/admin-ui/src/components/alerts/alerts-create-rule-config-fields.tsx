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
        <Label htmlFor="worker-id">workerId (optional)</Label>
        <Input
          id="worker-id"
          value={workerId}
          onChange={(event) => setWorkerId(event.target.value)}
          placeholder="access-events-worker"
        />
      </div>
    )
  }

  if (type === 'outbox_backlog') {
    return (
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>source</Label>
          <Select value={outboxSource} onValueChange={(value) => setOutboxSource(value as 'core' | 'device_service')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="core">core</SelectItem>
              <SelectItem value="device_service">device_service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="outbox-max-new">maxNew</Label>
            <Input
              id="outbox-max-new"
              type="number"
              min={1}
              value={outboxMaxNew}
              onChange={(event) => setOutboxMaxNew(event.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outbox-max-age">maxOldestAgeMs</Label>
            <Input
              id="outbox-max-age"
              type="number"
              min={1}
              value={outboxMaxOldestAgeMs}
              onChange={(event) => setOutboxMaxOldestAgeMs(event.target.value)}
              placeholder="60000"
            />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'access_event_lag') {
    return (
      <div className="mt-3 space-y-2">
        <Label htmlFor="access-lag-max-age">maxOldestAgeMs</Label>
        <Input
          id="access-lag-max-age"
          type="number"
          min={1}
          value={accessEventMaxOldestAgeMs}
          onChange={(event) => setAccessEventMaxOldestAgeMs(event.target.value)}
          placeholder="120000"
          required
        />
      </div>
    )
  }

  if (type === 'error_spike') {
    return (
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>source</Label>
          <Select value={errorSpikeSource} onValueChange={(value) => setErrorSpikeSource(value as 'access_events' | 'outbox')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="access_events">access_events</SelectItem>
              <SelectItem value="outbox">outbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="error-spike-increase">increaseBy</Label>
          <Input
            id="error-spike-increase"
            type="number"
            min={1}
            value={errorSpikeIncreaseBy}
            onChange={(event) => setErrorSpikeIncreaseBy(event.target.value)}
            placeholder="10"
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
          <Label htmlFor="adapter-id">adapterId (optional)</Label>
          <Input
            id="adapter-id"
            value={adapterId}
            onChange={(event) => setAdapterId(event.target.value)}
            placeholder="mock-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adapter-vendor-key">vendorKey (optional)</Label>
          <Input
            id="adapter-vendor-key"
            value={adapterVendorKey}
            onChange={(event) => setAdapterVendorKey(event.target.value)}
            placeholder="dahua"
          />
        </div>
      </div>
    )
  }

  return null
}
