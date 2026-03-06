import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PersonsFeedbackAlerts } from './persons-feedback-alerts'
import { getPersonsImportStrings } from './persons-import-strings'
import { PersonsPageHeader } from './persons-page-header'
import { PersonsPageState } from './persons-page-state'
import { PersonsPageToolbar } from './persons-page-toolbar'
import { PersonsPagination } from './persons-pagination'
import { PersonsSelectionBar } from './persons-selection-bar'
import { PersonsSummaryCards } from './persons-summary-cards'
import { PersonsTable } from './persons-table'
import { PersonsViewDialogs } from './persons-view-dialogs'
import {
  countAppliedPersonsFilters,
  parseCsvFilterValue,
  stringifyCsvFilterValue
} from './persons-view.filters'
import { usePersonsViewSelection } from './persons-view.selection'
import type { CreatePersonWithAutoIdentitiesInput, PersonItem, UpdatePersonInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import {
  bulkCreatePersonTerminalUsers,
  bulkDeletePersons,
  createPerson,
  createPersonIdentity,
  deletePerson,
  listPersons,
  updatePerson
} from '@/lib/persons/service'
import { listDevices } from '@/lib/devices/service'
import { Route } from '@/routes/persons.index'
import { useSession } from '@/lib/auth/session-store'
import { ApiError } from '@/lib/api/types'

export function PersonsView() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const importStrings = getPersonsImportStrings(i18n.language)
  const canRead = session?.admin.permissions.includes('persons.read') ?? false
  const canWrite = session?.admin.permissions.includes('persons.write') ?? false

  const [persons, setPersons] = useState<Array<PersonItem>>([])
  const [devices, setDevices] = useState<Array<DeviceItem>>([])
  const [total, setTotal] = useState(0)
  const [iinFilter, setIinFilter] = useState(search.iin)
  const [queryFilter, setQueryFilter] = useState(search.query)
  const [limitFilter, setLimitFilter] = useState(search.limit)
  const [linkedStatusFilter, setLinkedStatusFilter] = useState(search.linkedStatus)
  const [includeDeviceIdsFilter, setIncludeDeviceIdsFilter] = useState(() => parseCsvFilterValue(search.includeDeviceIds))
  const [excludeDeviceIdsFilter, setExcludeDeviceIdsFilter] = useState(() => parseCsvFilterValue(search.excludeDeviceIds))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PersonItem | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bulkCreating, setBulkCreating] = useState(false)

  useEffect(() => {
    setIinFilter(search.iin)
    setQueryFilter(search.query)
    setLimitFilter(search.limit)
    setLinkedStatusFilter(search.linkedStatus)
    setIncludeDeviceIdsFilter(parseCsvFilterValue(search.includeDeviceIds))
    setExcludeDeviceIdsFilter(parseCsvFilterValue(search.excludeDeviceIds))
  }, [search.excludeDeviceIds, search.iin, search.includeDeviceIds, search.limit, search.linkedStatus, search.query])

  const rangeStart = total === 0 ? 0 : search.offset + 1
  const rangeEnd = total === 0 ? 0 : Math.min(search.offset + persons.length, total)
  const currentPage = Math.floor(search.offset / search.limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / search.limit))
  const linkedPersons = persons.filter((person) => person.hasDeviceIdentities).length
  const unlinkedPersons = persons.length - linkedPersons
  const filtersAppliedCount = countAppliedPersonsFilters(search)
  const {
    selectedPersonIds,
    setSelectedPersonIds,
    selectedVisibleIds,
    selectedVisiblePersons,
    allVisibleSelected,
    someVisibleSelected,
    onToggleSelected,
    onToggleAllVisible
  } = usePersonsViewSelection(persons)

  async function loadPersons() {
    setError(null)
    try {
      const next = await listPersons({
        limit: search.limit,
        offset: search.offset,
        iin: search.iin || undefined,
        query: search.query || undefined,
        linkedStatus: search.linkedStatus,
        includeDeviceIds: parseCsvFilterValue(search.includeDeviceIds),
        excludeDeviceIds: parseCsvFilterValue(search.excludeDeviceIds)
      })
      setPersons(next.persons)
      setTotal(next.page.total)
      setSelectedPersonIds({})
    } catch (value) {
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setError(value instanceof Error ? value.message : t('persons.loadFailed'))
    }
  }

  async function loadDeviceOptions() {
    try {
      setDevices(await listDevices())
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.filters.devicesLoadFailed'))
    }
  }

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }
    async function initialLoad() {
      setLoading(true)
      await Promise.all([loadPersons(), loadDeviceOptions()])
      setLoading(false)
    }
    void initialLoad()
  }, [canRead, search.excludeDeviceIds, search.iin, search.includeDeviceIds, search.limit, search.linkedStatus, search.offset, search.query])

  async function onRefresh() {
    setSuccessMessage(null)
    setRefreshing(true)
    await Promise.all([loadPersons(), loadDeviceOptions()])
    setRefreshing(false)
  }

  async function onCreatePerson(input: CreatePersonWithAutoIdentitiesInput) {
    setMutationError(null)
    setSuccessMessage(null)
    try {
      const created = await createPerson({ iin: input.iin, firstName: input.firstName, lastName: input.lastName })
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
          setMutationError(t('persons.autoMappingsFailed', { count: failed }))
        }
      }
      await loadPersons()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.createFailed'))
      throw value
    }
  }

  async function onUpdatePerson(personId: string, input: UpdatePersonInput) {
    setMutationError(null)
    setSuccessMessage(null)
    try {
      await updatePerson(personId, input)
      await loadPersons()
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.updateFailed'))
      throw value
    }
  }

  async function onBulkCreate(input: { personIds: Array<string>; deviceIds: Array<string>; validFrom: string; validTo: string }) {
    setMutationError(null)
    setSuccessMessage(null)
    setBulkCreating(true)
    try {
      const result = await bulkCreatePersonTerminalUsers(input)
      setBulkCreateOpen(false)
      await loadPersons()
      setSuccessMessage(
        t('persons.bulkTerminalCreate.successSummary', {
          success: result.success,
          failed: result.failed,
          skipped: result.total - result.success - result.failed
        })
      )
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : t('persons.bulkTerminalCreate.failed'))
    } finally {
      setBulkCreating(false)
    }
  }

  function onChangeIncludeDeviceIds(nextValue: Array<string>) {
    setIncludeDeviceIdsFilter(nextValue)
    setExcludeDeviceIdsFilter((current) => current.filter((deviceId) => !nextValue.includes(deviceId)))
  }

  function onChangeExcludeDeviceIds(nextValue: Array<string>) {
    setExcludeDeviceIdsFilter(nextValue)
    setIncludeDeviceIdsFilter((current) => current.filter((deviceId) => !nextValue.includes(deviceId)))
  }

  async function confirmDelete() {
    const bulkIds = selectedVisibleIds
    if (!deleteTarget && bulkIds.length === 0) {
      return
    }
    setMutationError(null)
    setSuccessMessage(null)
    setDeleting(true)
    try {
      if (deleteTarget) {
        await deletePerson(deleteTarget.id)
        setDeleteTarget(null)
        await loadPersons()
        setSuccessMessage(t('persons.deleteSummarySingle'))
        return
      }
      const result = await bulkDeletePersons({ personIds: bulkIds })
      setBulkDeleteOpen(false)
      await loadPersons()
      setSuccessMessage(t('persons.deleteSummaryBulk', { deleted: result.deleted, notFound: result.notFound, errors: result.errors }))
    } catch (value) {
      setMutationError(value instanceof Error ? value.message : deleteTarget ? t('persons.deleteFailed') : t('persons.bulkDeleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  async function applyFilters() {
    await navigate({
      search: (previous) => ({
        ...previous,
        limit: limitFilter,
        offset: 0,
        iin: iinFilter.trim(),
        query: queryFilter.trim(),
        linkedStatus: linkedStatusFilter,
        includeDeviceIds: stringifyCsvFilterValue(includeDeviceIdsFilter),
        excludeDeviceIds: stringifyCsvFilterValue(excludeDeviceIdsFilter)
      })
    })
  }

  async function resetFilters() {
    await navigate({
      search: (previous) => ({
        ...previous,
        limit: 20,
        offset: 0,
        iin: '',
        query: '',
        linkedStatus: 'all',
        includeDeviceIds: '',
        excludeDeviceIds: ''
      })
    })
  }

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return
    }
    await navigate({ search: (previous) => ({ ...previous, offset: (nextPage - 1) * previous.limit }) })
  }

  if (!canRead) return <PersonsPageState kind="accessDenied" />
  if (loading) return <PersonsPageState kind="loading" />
  if (error) return <PersonsPageState kind="error" message={error} />

  return (
    <div className="space-y-4">
      <PersonsPageHeader />
      <PersonsSummaryCards total={total} linkedPersons={linkedPersons} unlinkedPersons={unlinkedPersons} />
      <PersonsFeedbackAlerts mutationError={mutationError} successMessage={successMessage} />
      <PersonsPageToolbar
        importTitle={importStrings.title}
        canWrite={canWrite}
        devices={devices}
        iinFilter={iinFilter}
        queryFilter={queryFilter}
        limitFilter={limitFilter}
        linkedStatusFilter={linkedStatusFilter}
        includeDeviceIdsFilter={includeDeviceIdsFilter}
        excludeDeviceIdsFilter={excludeDeviceIdsFilter}
        filtersAppliedCount={filtersAppliedCount}
        loading={loading}
        refreshing={refreshing}
        onChangeIin={setIinFilter}
        onChangeQuery={setQueryFilter}
        onChangeLimit={setLimitFilter}
        onChangeLinkedStatus={setLinkedStatusFilter}
        onChangeIncludeDeviceIds={onChangeIncludeDeviceIds}
        onChangeExcludeDeviceIds={onChangeExcludeDeviceIds}
        onRefresh={() => void onRefresh()}
        onReset={resetFilters}
        onApply={applyFilters}
        onCreatePerson={(input) => onCreatePerson(input as CreatePersonWithAutoIdentitiesInput)}
      />
      <PersonsSelectionBar
        count={selectedVisibleIds.length}
        disabled={deleting || bulkCreating}
        canBulkCreate={canWrite && selectedVisiblePersons.length > 0}
        onClear={() => setSelectedPersonIds({})}
        onBulkCreate={() => setBulkCreateOpen(true)}
        onDelete={() => setBulkDeleteOpen(true)}
      />
      <PersonsTable
        persons={persons}
        canWrite={canWrite}
        deleting={deleting || bulkCreating}
        selectedPersonIds={selectedPersonIds}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleSelected={onToggleSelected}
        onToggleAllVisible={onToggleAllVisible}
        onRequestDeletePerson={setDeleteTarget}
        onUpdatePerson={onUpdatePerson}
      />
      <PersonsPagination rangeStart={rangeStart} rangeEnd={rangeEnd} total={total} currentPage={currentPage} totalPages={totalPages} loading={loading} onGoToPage={(page) => void goToPage(page)} />
      <PersonsViewDialogs
        bulkCreateOpen={bulkCreateOpen}
        bulkCreating={bulkCreating}
        bulkDeleteOpen={bulkDeleteOpen}
        deleteTarget={deleteTarget}
        deleting={deleting}
        devices={devices}
        error={mutationError}
        selectedVisibleIds={selectedVisibleIds}
        selectedVisiblePersons={selectedVisiblePersons}
        setBulkCreateOpen={setBulkCreateOpen}
        setBulkDeleteOpen={setBulkDeleteOpen}
        setDeleteTarget={setDeleteTarget}
        onConfirmDelete={() => void confirmDelete()}
        onBulkCreate={(input) => void onBulkCreate(input)}
      />
    </div>
  )
}
