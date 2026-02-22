import { ChevronDown, ChevronUp } from "lucide-react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"

import type { AccessEventStatus } from "@/lib/access-events/types"
import type { AccessEventsFilterDraft } from "./access-events-view.helpers"
import {
  accessEventStatusLabel,
  directionLabel,
} from "@/lib/i18n/enum-labels"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AccessEventsFiltersProps = {
  filtersOpen: boolean
  appliedFiltersCount: number
  draftFilters: AccessEventsFilterDraft
  draftLimit: number
  onFiltersOpenChange: (open: boolean) => void
  onDraftFiltersChange: (updater: (prev: AccessEventsFilterDraft) => AccessEventsFilterDraft) => void
  onDraftLimitChange: (limit: number) => void
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onResetFilters: () => Promise<void>
}

export function AccessEventsFilters({
  filtersOpen,
  appliedFiltersCount,
  draftFilters,
  draftLimit,
  onFiltersOpenChange,
  onDraftFiltersChange,
  onDraftLimitChange,
  onApplyFilters,
  onResetFilters
}: AccessEventsFiltersProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <Collapsible open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {t("common.filters.title")}
              {appliedFiltersCount > 0 ? (
                <Badge variant="default">{t("common.filters.appliedCount", { count: appliedFiltersCount })}</Badge>
              ) : (
                <Badge variant="outline">{t("common.filters.noFilters")}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t("accessEvents.filtersDescription")}
            </CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline">
              {filtersOpen ? (
                <>
                  {t("common.actions.hideFilters")}
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  {t("common.actions.showFilters")}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => void onApplyFilters(event)}>
              <Select
                value={draftFilters.status}
                onValueChange={(value) => onDraftFiltersChange((prev) => ({ ...prev, status: value as "all" | AccessEventStatus }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{accessEventStatusLabel(t, "all")}</SelectItem>
                  <SelectItem value="NEW">{accessEventStatusLabel(t, "NEW")}</SelectItem>
                  <SelectItem value="PROCESSING">{accessEventStatusLabel(t, "PROCESSING")}</SelectItem>
                  <SelectItem value="PROCESSED">{accessEventStatusLabel(t, "PROCESSED")}</SelectItem>
                  <SelectItem value="FAILED_RETRY">{accessEventStatusLabel(t, "FAILED_RETRY")}</SelectItem>
                  <SelectItem value="UNMATCHED">{accessEventStatusLabel(t, "UNMATCHED")}</SelectItem>
                  <SelectItem value="ERROR">{accessEventStatusLabel(t, "ERROR")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={draftFilters.direction}
                onValueChange={(value) => onDraftFiltersChange((prev) => ({ ...prev, direction: value as "all" | "IN" | "OUT" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.filters.direction")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{directionLabel(t, "all")}</SelectItem>
                  <SelectItem value="IN">{directionLabel(t, "IN")}</SelectItem>
                  <SelectItem value="OUT">{directionLabel(t, "OUT")}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={draftFilters.deviceId}
                onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, deviceId: event.target.value }))}
                placeholder={t("accessEvents.deviceIdPlaceholder")}
              />

              <Input
                value={draftFilters.iin}
                onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, iin: event.target.value }))}
                placeholder={t("common.labels.iin")}
              />

              <Input
                value={draftFilters.terminalPersonId}
                onChange={(event) => onDraftFiltersChange((prev) => ({ ...prev, terminalPersonId: event.target.value }))}
                placeholder={t("common.placeholders.terminalPersonId")}
              />

              <Select
                value={String(draftLimit)}
                onValueChange={(value) => onDraftLimitChange(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("common.filters.pageSize")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">{t("common.pagination.perPage", { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t("common.pagination.perPage", { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t("common.pagination.perPage", { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>

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
                  {t("common.actions.reset")}
                </Button>
                <Button type="submit">{t("common.actions.applyFilters")}</Button>
              </div>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
