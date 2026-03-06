import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PersonDeleteDialog } from './person-delete-dialog'
import { PersonIdentitiesSection } from './person-identities-section'
import { PersonTerminalSyncPanel } from './person-terminal-sync-panel'
import { PersonsUpsertPanel } from './persons-upsert-panel'
import { getPersonsImportStrings } from './persons-import-strings'
import type { PersonIdentityItem, PersonItem, UpdatePersonInput, UpsertPersonIdentityInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import {
  createPersonIdentity,
  deletePerson,
  deletePersonIdentity,
  getPerson,
  listPersonIdentities,
  updatePerson,
  updatePersonIdentity
} from '@/lib/persons/service'
import { listDevices } from '@/lib/devices/service'
import { useSession } from '@/lib/auth/session-store'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type PersonDetailsViewProps = {
  personId: string
}

function formatPersonName(person: PersonItem) {
  const chunks = [person.firstName, person.lastName].filter(Boolean)
  return chunks.length > 0 ? chunks.join(' ') : ''
}

export function PersonDetailsView({ personId }: PersonDetailsViewProps) {
  const { t, i18n } = useTranslation()
  const importStrings = getPersonsImportStrings(i18n.language)
  const router = useRouter()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('persons.read') ?? false
  const canWrite = session?.admin.permissions.includes('persons.write') ?? false
  const canWriteIdentities = canWrite

  const [person, setPerson] = useState<PersonItem | null>(null)
  const [identities, setIdentities] = useState<Array<PersonIdentityItem>>([])
  const [devices, setDevices] = useState<Array<DeviceItem>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [deletingIdentityId, setDeletingIdentityId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPerson, setDeletingPerson] = useState(false)

  const personName = useMemo(() => (person ? formatPersonName(person) : ''), [person])

  async function load() {
    setError(null)
    try {
      const [nextPerson, nextIdentities] = await Promise.all([
        getPerson(personId),
        listPersonIdentities(personId)
      ])
      setPerson(nextPerson)
      setIdentities(nextIdentities)

      try {
        const nextDevices = await listDevices()
        setDevices(nextDevices)
      } catch {
        setDevices([])
      }
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('persons.loadPersonFailed'))
    }
  }

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }

    async function initialLoad() {
      setLoading(true)
      await load()
      setLoading(false)
    }

    void initialLoad()
  }, [canRead, personId])

  async function onUpdatePerson(patch: UpdatePersonInput) {
    setMutationError(null)
    try {
      await updatePerson(personId, patch)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.updateFailed'))
      throw value
    }
  }

  async function onCreateIdentity(input: UpsertPersonIdentityInput) {
    setMutationError(null)
    try {
      await createPersonIdentity(personId, input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.createIdentityFailed'))
      throw value
    }
  }

  async function onUpdateIdentity(identityId: string, input: UpsertPersonIdentityInput) {
    setMutationError(null)
    try {
      await updatePersonIdentity(personId, identityId, input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.updateIdentityFailed'))
      throw value
    }
  }

  async function onDeleteIdentity(identityId: string) {
    if (!canWriteIdentities || deletingIdentityId) {
      return
    }
    if (!window.confirm(t('persons.confirmDeleteIdentity'))) {
      return
    }

    setMutationError(null)
    setDeletingIdentityId(identityId)
    try {
      await deletePersonIdentity(personId, identityId)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.deleteIdentityFailed'))
    } finally {
      setDeletingIdentityId(null)
    }
  }

  async function onDeletePerson() {
    setMutationError(null)
    setDeletingPerson(true)

    try {
      await deletePerson(personId)
      await router.navigate({
        to: '/persons',
        search: {
          limit: 20,
          offset: 0,
          iin: '',
          query: '',
          linkedStatus: 'all',
          includeDeviceIds: '',
          excludeDeviceIds: ''
        }
      })
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.deleteFailed'))
    } finally {
      setDeletingPerson(false)
      setDeleteDialogOpen(false)
    }
  }

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>{t('persons.accessDeniedDescription')}</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !person) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('persons.personPageLoadFailedTitle')}</AlertTitle>
        <AlertDescription>{error ?? t('persons.personNotFound')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{personName || t('persons.unknownName')}</h1>
            <p className="text-sm text-muted-foreground">{t('common.labels.iin')}: {person.iin}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/persons/import">
              <Button type="button" variant="outline">
                <Upload className="h-4 w-4" />
                {importStrings.title}
              </Button>
            </Link>
            <PersonsUpsertPanel
              mode="edit"
              person={person}
              canWrite={canWrite}
              onSubmit={(input) => onUpdatePerson(input as UpdatePersonInput)}
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!canWrite || deletingPerson}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              {deletingPerson ? t('persons.deleting') : t('persons.delete')}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{person.terminalPersonId ?? t('persons.noGlobalTerminalId')}</Badge>
          <span>{t('common.labels.created')}: {new Date(person.createdAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-GB')}</span>
        </div>
      </div>

      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      <PersonTerminalSyncPanel
        person={person}
        devices={devices}
        identities={identities}
        canWrite={canWriteIdentities}
        onApplied={load}
      />

      <PersonIdentitiesSection
        personId={personId}
        personIin={person.iin}
        devices={devices}
        identities={identities}
        canWrite={canWriteIdentities}
        deletingIdentityId={deletingIdentityId}
        onCreateIdentity={onCreateIdentity}
        onUpdateIdentity={onUpdateIdentity}
        onDeleteIdentity={onDeleteIdentity}
        onApplied={load}
      />

      <PersonDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleting={deletingPerson}
        count={1}
        personName={personName || t('persons.unknownName')}
        onConfirm={() => void onDeletePerson()}
      />
    </div>
  )
}
