import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { PersonDeviceIdentity, PersonLookupItem, UnmatchedAccessEventItem } from '@/lib/access-events/types'
import { directionLabel } from '@/lib/i18n/enum-labels'
import { listPersonIdentities, mapTerminalIdentity, searchPersonsByIin } from '@/lib/access-events/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AccessEventsMapFormProps = {
  event: UnmatchedAccessEventItem
  canMap: boolean
  onMapped: () => Promise<void>
  onClose: () => void
}

function personLabel(person: PersonLookupItem) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
  return name ? `${name} (${person.iin})` : person.iin
}

export function AccessEventsMapForm({ event, canMap, onMapped, onClose }: AccessEventsMapFormProps) {
  const { t } = useTranslation()
  const [iinQuery, setIinQuery] = useState(event.iin ?? '')
  const [persons, setPersons] = useState<Array<PersonLookupItem>>([])
  const [searching, setSearching] = useState(false)

  const [personId, setPersonId] = useState('')
  const [terminalPersonId, setTerminalPersonId] = useState(event.terminalPersonId ?? '')
  const [personIdentities, setPersonIdentities] = useState<Array<PersonDeviceIdentity>>([])
  const [loadingIdentities, setLoadingIdentities] = useState(false)
  const [identityHint, setIdentityHint] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const canSearch = useMemo(() => /^\d{1,12}$/.test(iinQuery.trim()), [iinQuery])

  async function loadPersonDevices(nextPersonId: string) {
    if (!nextPersonId.trim()) {
      setPersonIdentities([])
      setIdentityHint(null)
      return
    }

    setLoadingIdentities(true)
    setIdentityHint(null)
    try {
      const identities = await listPersonIdentities(nextPersonId)
      setPersonIdentities(identities)

      const matchedIdentity = identities.find((identity) => identity.deviceId === event.deviceId)
      if (matchedIdentity) {
        setTerminalPersonId(matchedIdentity.terminalPersonId)
        setIdentityHint(t('accessEvents.identityDetectedForDevice', { deviceId: event.deviceId }))
      } else if (identities.length > 0) {
        setIdentityHint(t('accessEvents.identityNoMappingForDevice', { deviceId: event.deviceId }))
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : t('accessEvents.loadPersonDevicesFailed'))
      setPersonIdentities([])
    } finally {
      setLoadingIdentities(false)
    }
  }

  async function onSearch() {
    if (!canSearch) {
      setError(t('accessEvents.iinQueryDigitsValidation'))
      return
    }

    setSearching(true)
    setError(null)
    try {
      const found = await searchPersonsByIin(iinQuery.trim(), 20)
      setPersons(found)
      if (found.length === 0) {
        setError(t('common.empty.noPersonsByIin'))
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : t('accessEvents.searchPersonsFailed'))
    } finally {
      setSearching(false)
    }
  }

  async function onSubmit(eventForm: React.FormEvent<HTMLFormElement>) {
    eventForm.preventDefault()

    if (!canMap) {
      setError(t('accessEvents.missingMapPermission'))
      return
    }

    if (!personId.trim()) {
      setError(t('accessEvents.personIdRequired'))
      return
    }

    if (!terminalPersonId.trim()) {
      setError(t('accessEvents.terminalPersonIdRequired'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await mapTerminalIdentity({
        personId: personId.trim(),
        deviceId: event.deviceId,
        terminalPersonId: terminalPersonId.trim()
      })
      setResult(t('accessEvents.mappingResultTemplate', { status: response.status, updatedEvents: response.updatedEvents }))
      await onMapped()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('accessEvents.mapTerminalIdentityFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 p-4 pt-0" onSubmit={onSubmit}>
      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
        <p><span className="text-muted-foreground">{t('common.labels.eventId')}:</span> {event.id}</p>
        <p><span className="text-muted-foreground">{t('common.labels.device')}:</span> {event.deviceId}</p>
        <p><span className="text-muted-foreground">{t('common.labels.direction')}:</span> {directionLabel(t, event.direction)}</p>
        <p><span className="text-muted-foreground">{t('common.labels.iin')}:</span> {event.iin ?? '-'}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`iin-${event.id}`}>{t('accessEvents.findPersonByIin')}</Label>
        <div className="flex gap-2">
          <Input
            id={`iin-${event.id}`}
            value={iinQuery}
            onChange={(value) => setIinQuery(value.target.value)}
            placeholder={t('common.placeholders.searchIinPrefix')}
            disabled={searching || submitting}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canSearch || searching || submitting}
            onClick={() => void onSearch()}
          >
            <Search className="h-4 w-4" />
            {searching ? t('common.actions.searching') : t('common.actions.search')}
          </Button>
        </div>
      </div>

      {persons.length > 0 ? (
        <div className="space-y-2">
          <Label>{t('accessEvents.personSearchResults')}</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border/70 p-2">
            {persons.map((person) => (
              <button
                key={person.id}
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-md border border-border/60 px-2 py-1.5 text-left hover:bg-muted/40"
                onClick={() => {
                  setPersonId(person.id)
                  void loadPersonDevices(person.id)
                }}
              >
                <div>
                  <p className="text-sm font-medium">{personLabel(person)}</p>
                  <p className="text-xs text-muted-foreground">{t('common.labels.id')}: {person.id}</p>
                </div>
                {personId === person.id ? <Badge>{t('common.selected')}</Badge> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`person-id-${event.id}`}>{t('common.labels.personId')}</Label>
        <Input
          id={`person-id-${event.id}`}
          value={personId}
          onChange={(value) => setPersonId(value.target.value)}
          onBlur={() => void loadPersonDevices(personId)}
          placeholder={t('common.placeholders.personUuid')}
          disabled={submitting}
        />
        {loadingIdentities ? <p className="text-xs text-muted-foreground">{t('accessEvents.loadingPersonDevices')}</p> : null}
      </div>

      {personIdentities.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
          <Label>{t('accessEvents.personDeviceMappings')}</Label>
          <div className="flex flex-wrap gap-2">
            {personIdentities.map((identity) => (
              <Badge
                key={identity.id}
                variant={identity.deviceId === event.deviceId ? 'default' : 'outline'}
                className="font-mono text-xs"
              >
                {identity.deviceId}: {identity.terminalPersonId}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {identityHint ? (
        <Alert role="status" className="border-sky-300/60 bg-sky-50 text-sky-900">
          <AlertTitle>{t('accessEvents.deviceMappingsLoaded')}</AlertTitle>
          <AlertDescription>{identityHint}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`terminal-person-id-${event.id}`}>{t('common.placeholders.terminalPersonId')}</Label>
        <Input
          id={`terminal-person-id-${event.id}`}
          value={terminalPersonId}
          onChange={(value) => {
            setTerminalPersonId(value.target.value)
            setIdentityHint(null)
          }}
          placeholder={t('common.placeholders.terminalPersonId')}
          disabled={submitting}
        />
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('accessEvents.mappingFailed')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Alert role="status" className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>{t('accessEvents.mappingCompleted')}</AlertTitle>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
        <Button type="submit" disabled={!canMap || submitting}>
          {submitting ? t('common.actions.mapping') : t('common.actions.map')}
        </Button>
      </div>
    </form>
  )
}
