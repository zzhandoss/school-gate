import { Link } from '@tanstack/react-router'
import { RefreshCw, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PersonsFiltersPanel } from './persons-filters-panel'
import { PersonsUpsertPanel } from './persons-upsert-panel'
import type { CreatePersonWithAutoIdentitiesInput, UpdatePersonInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import { Button } from '@/components/ui/button'

type PersonsPageToolbarProps = {
  importTitle: string
  canWrite: boolean
  devices: Array<DeviceItem>
  iinFilter: string
  queryFilter: string
  limitFilter: number
  linkedStatusFilter: 'all' | 'linked' | 'unlinked'
  includeDeviceIdsFilter: Array<string>
  excludeDeviceIdsFilter: Array<string>
  filtersAppliedCount: number
  loading: boolean
  refreshing: boolean
  onChangeIin: (value: string) => void
  onChangeQuery: (value: string) => void
  onChangeLimit: (value: number) => void
  onChangeLinkedStatus: (value: 'all' | 'linked' | 'unlinked') => void
  onChangeIncludeDeviceIds: (value: Array<string>) => void
  onChangeExcludeDeviceIds: (value: Array<string>) => void
  onRefresh: () => void
  onReset: () => Promise<void> | void
  onApply: () => Promise<void> | void
  onCreatePerson: (input: CreatePersonWithAutoIdentitiesInput | UpdatePersonInput) => Promise<void>
}

export function PersonsPageToolbar({
    importTitle,
    canWrite,
    devices,
    iinFilter,
    queryFilter,
    limitFilter,
    linkedStatusFilter,
    includeDeviceIdsFilter,
    excludeDeviceIdsFilter,
    filtersAppliedCount,
    loading,
    refreshing,
    onChangeIin,
    onChangeQuery,
    onChangeLimit,
    onChangeLinkedStatus,
    onChangeIncludeDeviceIds,
    onChangeExcludeDeviceIds,
    onRefresh,
    onReset,
    onApply,
    onCreatePerson
}: PersonsPageToolbarProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
                <div className="text-sm font-medium">{t("common.labels.actions")}</div>
                <div className="text-xs text-muted-foreground">{t("persons.tableDescription")}</div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
                <PersonsFiltersPanel
                    iinFilter={iinFilter}
                    queryFilter={queryFilter}
                    limitFilter={limitFilter}
                    linkedStatusFilter={linkedStatusFilter}
                    includeDeviceIdsFilter={includeDeviceIdsFilter}
                    excludeDeviceIdsFilter={excludeDeviceIdsFilter}
                    devices={devices}
                    applying={loading}
                    appliedCount={filtersAppliedCount}
                    onChangeIin={onChangeIin}
                    onChangeQuery={onChangeQuery}
                    onChangeLimit={onChangeLimit}
                    onChangeLinkedStatus={onChangeLinkedStatus}
                    onChangeIncludeDeviceIds={onChangeIncludeDeviceIds}
                    onChangeExcludeDeviceIds={onChangeExcludeDeviceIds}
                    onApply={onApply}
                    onReset={onReset}
                />
                <Button type="button" variant="outline" disabled={refreshing || loading} onClick={onRefresh}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? t("common.actions.refreshing") : t("common.actions.refresh")}
                </Button>
                <Link to="/persons/import">
                    <Button type="button" variant="outline">
                        <Upload className="h-4 w-4" />
                        {importTitle}
                    </Button>
                </Link>
                <PersonsUpsertPanel
                    mode="create"
                    canWrite={canWrite}
                    onSubmit={onCreatePerson}
                />
            </div>
        </div>
    );
}
