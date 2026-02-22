import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'

import { PersonIdentityPanel } from './person-identity-panel'
import { PersonIdentityAutoDialog } from './person-identity-auto-dialog'
import { PersonsUpsertPanel } from './persons-upsert-panel'
import type { PersonIdentityItem, PersonItem, UpdatePersonInput, UpsertPersonIdentityInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import {
  createPersonIdentity,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type PersonDetailsViewProps = {
  personId: string
}

function formatPersonName(person: PersonItem) {
  const chunks = [person.firstName, person.lastName].filter(Boolean)
  return chunks.length > 0 ? chunks.join(' ') : 'Unknown name'
}

export function PersonDetailsView({ personId }: PersonDetailsViewProps) {
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
      setError(value instanceof Error ? value.message : 'Failed to load person')
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
      setMutationError(value instanceof Error ? value.message : 'Failed to update person')
      throw value
    }
  }

  async function onCreateIdentity(input: UpsertPersonIdentityInput) {
    setMutationError(null)
    try {
      await createPersonIdentity(personId, input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to create identity')
      throw value
    }
  }

  async function onUpdateIdentity(identityId: string, input: UpsertPersonIdentityInput) {
    setMutationError(null)
    try {
      await updatePersonIdentity(personId, identityId, input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to update identity')
      throw value
    }
  }

  async function onDeleteIdentity(identityId: string) {
    if (!canWriteIdentities || deletingIdentityId) {
      return
    }
    if (!window.confirm('Delete this identity mapping?')) {
      return
    }

    setMutationError(null)
    setDeletingIdentityId(identityId)
    try {
      await deletePersonIdentity(personId, identityId)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to delete identity')
    } finally {
      setDeletingIdentityId(null)
    }
  }

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>Your account does not have `persons.read` permission.</AlertDescription>
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
        <AlertTitle>Person page failed to load</AlertTitle>
        <AlertDescription>{error ?? 'Person was not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{personName}</h1>
            <p className="text-sm text-muted-foreground">IIN: {person.iin}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/persons">Back</Link>
            </Button>
            <PersonsUpsertPanel
              mode="edit"
              person={person}
              canWrite={canWrite}
              onSubmit={(input) => onUpdatePerson(input as UpdatePersonInput)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{person.terminalPersonId ?? 'no global terminal id'}</Badge>
          <span>Created: {new Date(person.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Mutation failed</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/70">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Device identities</h2>
            <p className="text-xs text-muted-foreground">
              Terminal IDs are scoped by device.
            </p>
          </div>
          <PersonIdentityPanel
            mode="create"
            personIin={person.iin}
            devices={devices}
            canWrite={canWriteIdentities}
            onSubmit={onCreateIdentity}
          />
          <PersonIdentityAutoDialog personId={personId} canWrite={canWriteIdentities} onApplied={load} />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Terminal Person ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {identities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No identities for this person.
                  </TableCell>
                </TableRow>
              ) : (
                identities.map((identity) => (
                  <TableRow key={identity.id}>
                    <TableCell className="font-medium">{identity.deviceId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {identity.terminalPersonId}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(identity.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PersonIdentityPanel
                          mode="edit"
                          identity={identity}
                          devices={devices}
                          canWrite={canWriteIdentities}
                          onSubmit={(input) => onUpdateIdentity(identity.id, input)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!canWriteIdentities || deletingIdentityId === identity.id}
                          onClick={() => void onDeleteIdentity(identity.id)}
                        >
                          {deletingIdentityId === identity.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
