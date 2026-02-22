import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'

import { PersonsTable } from './persons-table'
import type { CreatePersonWithAutoIdentitiesInput, PersonItem, UpdatePersonInput } from '@/lib/persons/types'
import { createPerson, createPersonIdentity, listPersons, updatePerson } from '@/lib/persons/service'
import { Route } from '@/routes/persons.index'
import { useSession } from '@/lib/auth/session-store'
import { ApiError } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  pages.add(currentPage)
  pages.add(currentPage - 1)
  pages.add(currentPage + 1)

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: Array<number | 'ellipsis'> = []
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push('ellipsis')
    }
    items.push(page)
  }

  return items
}

export function PersonsView() {
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const canRead = session?.admin.permissions.includes('persons.read') ?? false
  const canWrite = session?.admin.permissions.includes('persons.write') ?? false

  const [persons, setPersons] = useState<Array<PersonItem>>([])
  const [total, setTotal] = useState(0)
  const [iinFilter, setIinFilter] = useState(search.iin)
  const [queryFilter, setQueryFilter] = useState(search.query)
  const [limitFilter, setLimitFilter] = useState(search.limit)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  useEffect(() => {
    setIinFilter(search.iin)
    setQueryFilter(search.query)
    setLimitFilter(search.limit)
  }, [search.iin, search.limit, search.query])

  const rangeStart = total === 0 ? 0 : search.offset + 1
  const rangeEnd = total === 0 ? 0 : Math.min(search.offset + persons.length, total)
  const currentPage = Math.floor(search.offset / search.limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / search.limit))
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  async function load() {
    setError(null)
    try {
      const next = await listPersons({
        limit: search.limit,
        offset: search.offset,
        iin: search.iin || undefined,
        query: search.query || undefined
      })
      setPersons(next.persons)
      setTotal(next.page.total)
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : 'Failed to load persons')
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
  }, [canRead, search.iin, search.limit, search.offset, search.query])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function onCreatePerson(input: CreatePersonWithAutoIdentitiesInput) {
    setMutationError(null)
    try {
      const created = await createPerson({
        iin: input.iin,
        firstName: input.firstName,
        lastName: input.lastName
      })

      if (input.autoIdentities && input.autoIdentities.length > 0) {
        let failed = 0
        for (const identity of input.autoIdentities) {
          try {
            await createPersonIdentity(created.id, identity)
          } catch {
            failed += 1
          }
        }
        if (failed > 0) {
          setMutationError(`Person created, but ${failed} auto identity mappings failed.`)
        }
      }

      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to create person')
      throw value
    }
  }

  async function onUpdatePerson(personId: string, input: UpdatePersonInput) {
    setMutationError(null)
    try {
      await updatePerson(personId, input)
      await load()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : 'Failed to update person')
      throw value
    }
  }

  async function applyFilters() {
    await navigate({
      search: {
        limit: limitFilter,
        offset: 0,
        iin: iinFilter.trim(),
        query: queryFilter.trim()
      }
    })
  }

  async function resetFilters() {
    await navigate({
      search: {
        limit: 20,
        offset: 0,
        iin: '',
        query: ''
      }
    })
  }

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return
    }

    await navigate({
      search: (previous) => ({
        ...previous,
        offset: (nextPage - 1) * previous.limit
      })
    })
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
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>Persons page failed to load</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold">Persons</h1>
          <Button type="button" variant="outline" disabled={refreshing || loading} onClick={() => void onRefresh()}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Person profiles and device-scoped terminal identities.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Input
            placeholder="IIN prefix (optional)"
            value={iinFilter}
            onChange={(event) => setIinFilter(event.target.value)}
          />
          <Input
            placeholder="Name or IIN contains"
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
          />
          <Select value={String(limitFilter)} onValueChange={(value) => setLimitFilter(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void resetFilters()}>
              Reset
            </Button>
            <Button type="button" onClick={() => void applyFilters()}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Mutation failed</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      <PersonsTable
        persons={persons}
        canWrite={canWrite}
        onCreatePerson={onCreatePerson}
        onUpdatePerson={onUpdatePerson}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4">
        <p className="text-sm text-muted-foreground">
          {rangeStart}-{rangeEnd} of {total} persons.
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={!canGoPrev || loading}
                onClick={() => void goToPage(currentPage - 1)}
              />
            </PaginationItem>
            {paginationItems.map((item, index) => (
              <PaginationItem key={`${String(item)}-${index}`}>
                {item === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(event) => {
                      event.preventDefault()
                      void goToPage(item)
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={!canGoNext || loading}
                onClick={() => void goToPage(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
