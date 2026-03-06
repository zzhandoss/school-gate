import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FormEvent } from 'react'

import type { AuditLogsFilterDraft } from './audit-logs-view.helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AuditLogsFiltersProps = {
  filtersOpen: boolean
  appliedFiltersCount: number
  draftFilters: AuditLogsFilterDraft
  draftLimit: number
  onFiltersOpenChange: (open: boolean) => void
  onDraftFiltersChange: (updater: (prev: AuditLogsFilterDraft) => AuditLogsFilterDraft) => void
  onDraftLimitChange: (limit: number) => void
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onResetFilters: () => Promise<void>
}

export function AuditLogsFilters({
  filtersOpen,
  appliedFiltersCount,
  draftFilters,
  draftLimit,
  onFiltersOpenChange,
  onDraftFiltersChange,
  onDraftLimitChange,
  onApplyFilters,
  onResetFilters
}: AuditLogsFiltersProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <Collapsible open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {t('common.filters.title')}
              {appliedFiltersCount > 0 ? (
                <Badge variant="default">{t('common.filters.appliedCount', { count: appliedFiltersCount })}</Badge>
              ) : (
                <Badge variant="outline">{t('common.filters.noFilters')}</Badge>
              )}
            </CardTitle>
            <CardDescription>{t('auditLogs.filtersDescription')}</CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline">
              {filtersOpen ? (
                <>
                  {t('common.actions.hideFilters')}
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  {t('common.actions.showFilters')}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => void onApplyFilters(event)}>
                <Input
                  value={draftFilters.actorId}
                  onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, actorId: event.target.value }))}
                  placeholder={t('common.placeholders.actorId')}
                />

                <Input
                  value={draftFilters.action}
                  onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, action: event.target.value }))}
                  placeholder={t('common.placeholders.auditAction')}
                />

                <Input
                  value={draftFilters.entityType}
                  onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, entityType: event.target.value }))}
                  placeholder={t('common.placeholders.entityType')}
                />

                <Input
                  value={draftFilters.entityId}
                  onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, entityId: event.target.value }))}
                  placeholder={t('common.placeholders.entityId')}
                />

              <Select value={String(draftLimit)} onValueChange={(value) => onDraftLimitChange(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.filters.pageSize')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">{t('common.pagination.perPage', { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t('common.pagination.perPage', { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t('common.pagination.perPage', { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden md:block" />

              <Input
                type="datetime-local"
                value={draftFilters.from}
                onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, from: event.target.value }))}
              />

              <Input
                type="datetime-local"
                value={draftFilters.to}
                onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, to: event.target.value }))}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:col-span-3">
                <Button type="button" variant="outline" onClick={() => void onResetFilters()}>
                  {t('common.actions.reset')}
                </Button>
                <Button type="submit">{t('common.actions.applyFilters')}</Button>
              </div>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
