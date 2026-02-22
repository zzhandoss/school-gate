import { useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SubscriptionRequestItem } from '@/lib/subscription-requests/types'
import type { PersonItem } from '@/lib/persons/types'
import { createPerson, listPersons } from '@/lib/persons/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SubscriptionRequestResolveFormProps = {
  request: SubscriptionRequestItem
  canResolve: boolean
  onResolve: (requestId: string, personId: string) => Promise<void>
  onClose: () => void
}

function personLabel(person: PersonItem) {
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
  return fullName ? `${fullName} (${person.iin})` : person.iin
}

export function SubscriptionRequestResolveForm({
  request,
  canResolve,
  onResolve,
  onClose
}: SubscriptionRequestResolveFormProps) {
  const { t } = useTranslation()
  const [iinQuery, setIinQuery] = useState(request.iin)
  const [persons, setPersons] = useState<Array<PersonItem>>([])
  const [personId, setPersonId] = useState(request.personId ?? '')

  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createFirstName, setCreateFirstName] = useState('')
  const [createLastName, setCreateLastName] = useState('')
  const [createDialogError, setCreateDialogError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSearch = useMemo(() => /^\d{1,12}$/.test(iinQuery.trim()), [iinQuery])
  const canCreate = useMemo(() => /^\d{12}$/.test(iinQuery.trim()), [iinQuery])

  async function onSearch() {
    if (!canSearch) {
      setError(t('accessEvents.iinQueryDigitsValidation'))
      return
    }

    setSearching(true)
    setError(null)
    try {
      const found = await listPersons({ iin: iinQuery.trim(), limit: 20, offset: 0 })
      setPersons(found.persons)
      if (found.persons.length === 0) {
        setError(t('subscriptionRequests.noPersonsForIinQuery'))
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : t('accessEvents.searchPersonsFailed'))
    } finally {
      setSearching(false)
    }
  }

  async function onCreatePerson() {
    if (!canCreate) {
      setCreateDialogError(t('accessEvents.createRequiresExactIin'))
      return
    }

    setCreating(true)
    setCreateDialogError(null)
    try {
      const created = await createPerson({
        iin: iinQuery.trim(),
        firstName: createFirstName.trim() || null,
        lastName: createLastName.trim() || null
      })
      setPersons((prev) => {
        const exists = prev.some((item) => item.id === created.id)
        return exists ? prev : [created, ...prev]
      })
      setPersonId(created.id)
      setIsCreateDialogOpen(false)
      setCreateFirstName('')
      setCreateLastName('')
    } catch (value) {
      setCreateDialogError(value instanceof Error ? value.message : t('subscriptionRequests.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canResolve) {
      setError(t('subscriptionRequests.resolvePermissionMissing'))
      return
    }
    if (!personId.trim()) {
      setError(t('accessEvents.personIdRequired'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onResolve(request.id, personId.trim())
      onClose()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('subscriptionRequests.resolveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 p-4 pt-0" onSubmit={onSubmit}>
      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
        <p>
          <span className="text-muted-foreground">{t('common.labels.requestId')}:</span> {request.id}
        </p>
        <p>
          <span className="text-muted-foreground">{t('common.labels.telegram')}:</span> {request.tgUserId}
        </p>
        <p>
          <span className="text-muted-foreground">{t('common.labels.currentStatus')}:</span> {request.status}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`resolve-iin-${request.id}`}>{t('subscriptionRequests.findPersonByIin')}</Label>
        <div className="flex gap-2">
          <Input
            id={`resolve-iin-${request.id}`}
            value={iinQuery}
            onChange={(value) => setIinQuery(value.target.value)}
            placeholder={t('common.placeholders.searchIinPrefix')}
            disabled={searching || creating || submitting}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canSearch || searching || creating || submitting}
            onClick={() => void onSearch()}
          >
            <Search className="h-4 w-4" />
            {searching ? t('common.actions.searching') : t('common.actions.search')}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!canCreate || creating || submitting || persons.length > 0}
          onClick={() => {
            setCreateDialogError(null)
            setIsCreateDialogOpen(true)
          }}
        >
          <UserPlus className="h-4 w-4" />
          {t('subscriptionRequests.createPerson')}
        </Button>
      </div>
      {persons.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('subscriptionRequests.personFoundNoCreate')}
        </p>
      ) : null}

      {persons.length > 0 ? (
        <div className="space-y-2">
          <Label>{t('subscriptionRequests.searchResults')}</Label>
          <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border/70 p-2">
            {persons.map((person) => (
              <button
                key={person.id}
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-md border border-border/60 px-2 py-1.5 text-left hover:bg-muted/40"
                onClick={() => setPersonId(person.id)}
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
        <Label htmlFor={`resolve-person-id-${request.id}`}>{t('common.labels.personId')}</Label>
        <Input
          id={`resolve-person-id-${request.id}`}
          value={personId}
          onChange={(value) => setPersonId(value.target.value)}
          placeholder={t('common.placeholders.personUuid')}
          disabled={submitting}
        />
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('subscriptionRequests.resolveFailed')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
          {t('common.actions.close')}
        </Button>
        <Button type="submit" disabled={!canResolve || submitting}>
          {submitting ? t('common.actions.resolving') : t('common.actions.resolve')}
        </Button>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateDialogOpen(nextOpen)
          if (!nextOpen) {
            setCreateDialogError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subscriptionRequests.createPerson')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionRequests.createPersonDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`create-person-iin-${request.id}`}>{t('common.labels.iin')}</Label>
            <Input
              id={`create-person-iin-${request.id}`}
              value={iinQuery.trim()}
              readOnly
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`create-person-first-name-${request.id}`}>{t('common.labels.firstName')}</Label>
            <Input
              id={`create-person-first-name-${request.id}`}
              value={createFirstName}
              onChange={(value) => setCreateFirstName(value.target.value)}
              placeholder={t('common.placeholders.optional')}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`create-person-last-name-${request.id}`}>{t('common.labels.lastName')}</Label>
            <Input
              id={`create-person-last-name-${request.id}`}
              value={createLastName}
              onChange={(value) => setCreateLastName(value.target.value)}
              placeholder={t('common.placeholders.optional')}
              disabled={creating}
            />
          </div>

          {createDialogError ? (
            <Alert className="mt-2 border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('subscriptionRequests.createFailed')}</AlertTitle>
              <AlertDescription>{createDialogError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={creating}
              onClick={() => {
                setCreateDialogError(null)
                setIsCreateDialogOpen(false)
              }}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" disabled={!canCreate || creating} onClick={() => void onCreatePerson()}>
              {creating ? t('common.actions.creating') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
