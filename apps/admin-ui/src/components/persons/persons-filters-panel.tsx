import { useMemo, useState } from 'react'
import { Filter, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PersonsDeviceFilterMultiSelect } from './persons-device-filter-multi-select'
import type { ReactNode } from 'react'
import type { DeviceItem } from '@/lib/devices/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type PersonsFiltersPanelProps = {
  iinFilter: string
  queryFilter: string
  limitFilter: number
  linkedStatusFilter: 'all' | 'linked' | 'unlinked'
  includeDeviceIdsFilter: Array<string>
  excludeDeviceIdsFilter: Array<string>
  devices: Array<DeviceItem>
  applying: boolean
  appliedCount: number
  onChangeIin: (value: string) => void
  onChangeQuery: (value: string) => void
  onChangeLimit: (value: number) => void
  onChangeLinkedStatus: (value: 'all' | 'linked' | 'unlinked') => void
  onChangeIncludeDeviceIds: (value: Array<string>) => void
  onChangeExcludeDeviceIds: (value: Array<string>) => void
  onApply: () => Promise<void> | void
  onReset: () => Promise<void> | void
}

function FilterSection({
  title,
  description,
  children
}: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function ActiveFiltersSummary({
  appliedCount,
  iinFilter,
  queryFilter,
  limitFilter,
  linkedStatusFilter,
  includeDeviceIdsFilter,
  excludeDeviceIdsFilter
}: Pick<PersonsFiltersPanelProps, 'appliedCount' | 'iinFilter' | 'queryFilter' | 'limitFilter' | 'linkedStatusFilter' | 'includeDeviceIdsFilter' | 'excludeDeviceIdsFilter'>) {
  const { t } = useTranslation()

  const badges = [
    iinFilter.trim() ? `${t('common.labels.iin')}: ${iinFilter.trim()}` : null,
    queryFilter.trim() ? `${t('persons.filters.searchLabel')}: ${queryFilter.trim()}` : null,
    linkedStatusFilter !== 'all' ? t(`persons.filters.linkStatus.${linkedStatusFilter}`) : null,
    includeDeviceIdsFilter.length > 0 ? `${t('persons.filters.includeDevicesLabel')}: ${includeDeviceIdsFilter.length}` : null,
    excludeDeviceIdsFilter.length > 0 ? `${t('persons.filters.excludeDevicesLabel')}: ${excludeDeviceIdsFilter.length}` : null,
    limitFilter !== 20 ? t('common.pagination.perPage', { count: limitFilter }) : null
  ].filter((value): value is string => Boolean(value))

  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t('persons.filters.button')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appliedCount > 0 ? t('common.filters.appliedCount', { count: appliedCount }) : t('common.filters.noFilters')}
          </p>
        </div>
        {appliedCount > 0 ? (
          <Badge className="rounded-full px-2.5 py-0.5">{appliedCount}</Badge>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.length > 0 ? badges.map((badge) => (
          <Badge key={badge} variant="secondary" className="rounded-full px-2.5 py-0.5">
            {badge}
          </Badge>
        )) : (
          <span className="text-xs text-muted-foreground">{t('common.filters.noFilters')}</span>
        )}
      </div>
    </div>
  )
}

function FiltersBody({
  iinFilter,
  queryFilter,
  limitFilter,
  linkedStatusFilter,
  includeDeviceIdsFilter,
  excludeDeviceIdsFilter,
  devices,
  appliedCount,
  onChangeIin,
  onChangeQuery,
  onChangeLimit,
  onChangeLinkedStatus,
  onChangeIncludeDeviceIds,
  onChangeExcludeDeviceIds
}: Omit<PersonsFiltersPanelProps, 'applying' | 'onApply' | 'onReset'>) {
  const { t } = useTranslation()
  const deviceOptions = useMemo(
    () => [...devices].sort((left, right) => left.name.localeCompare(right.name)),
    [devices]
  )

  return (
    <div className="grid gap-4 p-4">
      <ActiveFiltersSummary
        appliedCount={appliedCount}
        iinFilter={iinFilter}
        queryFilter={queryFilter}
        limitFilter={limitFilter}
        linkedStatusFilter={linkedStatusFilter}
        includeDeviceIdsFilter={includeDeviceIdsFilter}
        excludeDeviceIdsFilter={excludeDeviceIdsFilter}
      />

      <FilterSection title={t('persons.filters.title')} description={t('persons.filters.description')}>
        <div className="grid gap-2">
          <Label htmlFor="persons-filter-iin">{t('common.labels.iin')}</Label>
          <Input
            id="persons-filter-iin"
            placeholder={t('common.placeholders.searchIinPrefix')}
            value={iinFilter}
            onChange={(event) => onChangeIin(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="persons-filter-query">{t('persons.filters.searchLabel')}</Label>
          <Input
            id="persons-filter-query"
            placeholder={t('persons.searchByNameOrIin')}
            value={queryFilter}
            onChange={(event) => onChangeQuery(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t('persons.filters.linkStatusLabel')}</Label>
          <Select value={linkedStatusFilter} onValueChange={(value) => onChangeLinkedStatus(value as 'all' | 'linked' | 'unlinked')}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={t('persons.filters.linkStatusLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('persons.filters.linkStatus.all')}</SelectItem>
              <SelectItem value="linked">{t('persons.filters.linkStatus.linked')}</SelectItem>
              <SelectItem value="unlinked">{t('persons.filters.linkStatus.unlinked')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>{t('common.filters.pageSize')}</Label>
          <Select value={String(limitFilter)} onValueChange={(value) => onChangeLimit(Number(value))}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={t('common.filters.pageSize')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
              <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
              <SelectItem value="100">{t('common.pagination.perPage', { count: 100 })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterSection>
      <FilterSection
        title={t('persons.filters.deviceLabel')}
        description={t('persons.filters.description')}
      >
        <div className="grid gap-2">
          <Label>{t('persons.filters.includeDevicesLabel')}</Label>
          <PersonsDeviceFilterMultiSelect
            devices={deviceOptions}
            value={includeDeviceIdsFilter}
            placeholder={t('persons.filters.includeDevicesPlaceholder')}
            onChange={onChangeIncludeDeviceIds}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('persons.filters.excludeDevicesLabel')}</Label>
          <PersonsDeviceFilterMultiSelect
            devices={deviceOptions}
            value={excludeDeviceIdsFilter}
            placeholder={t('persons.filters.excludeDevicesPlaceholder')}
            onChange={onChangeExcludeDeviceIds}
          />
        </div>
      </FilterSection>
    </div>
  )
}

export function PersonsFiltersPanel(props: PersonsFiltersPanelProps) {
  const { t } = useTranslation()
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function closePanels() {
    setDesktopOpen(false)
    setMobileOpen(false)
  }

  async function handleApply() {
    await props.onApply()
    closePanels()
  }

  async function handleReset() {
    await props.onReset()
    closePanels()
  }

  const triggerChildren = (
    <>
      <SlidersHorizontal className="h-4 w-4" />
      {t('persons.filters.button')}
      {props.appliedCount > 0 ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {props.appliedCount}
        </span>
      ) : null}
    </>
  )

  return (
    <>
      <Button type="button" variant="outline" className="hidden gap-2 rounded-xl sm:inline-flex" onClick={() => setDesktopOpen(true)}>
        {triggerChildren}
      </Button>
      <Button type="button" variant="outline" className="gap-2 rounded-xl sm:hidden" onClick={() => setMobileOpen(true)}>
        {triggerChildren}
      </Button>
      <Sheet open={desktopOpen} onOpenChange={setDesktopOpen}>
        <SheetContent side="right" className="flex h-[100dvh] w-full flex-col p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border/70">
            <SheetTitle>{t('persons.filters.title')}</SheetTitle>
            <SheetDescription>{t('persons.filters.description')}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FiltersBody {...props} />
          </div>
          <SheetFooter className="border-t border-border/70 sm:justify-between">
            <Button type="button" variant="outline" disabled={props.applying} onClick={handleReset}>
              {t('common.actions.reset')}
            </Button>
            <Button type="button" className="min-w-36" disabled={props.applying} onClick={handleApply}>
              <Filter className="h-4 w-4" />
              {t('common.actions.applyFilters')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent className="flex max-h-[90dvh] flex-col p-0">
          <DrawerHeader className="border-b border-border/70">
            <DrawerTitle>{t('persons.filters.title')}</DrawerTitle>
            <DrawerDescription>{t('persons.filters.description')}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FiltersBody {...props} />
          </div>
          <DrawerFooter className="border-t border-border/70">
            <Button type="button" variant="outline" disabled={props.applying} onClick={handleReset}>
              {t('common.actions.reset')}
            </Button>
            <Button type="button" disabled={props.applying} onClick={handleApply}>
              <Filter className="h-4 w-4" />
              {t('common.actions.applyFilters')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
