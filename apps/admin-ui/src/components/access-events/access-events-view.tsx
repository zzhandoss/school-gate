import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { Link2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AccessEventsFilters } from "./access-events-filters"
import { AccessEventsTable } from "./access-events-table"
import {
  DEFAULT_FILTERS,
  buildPaginationItems,
  countAppliedFilters,
  fromSearchToDraft,
  toListAccessEventsInput
} from "./access-events-view.helpers"
import type { AccessEventsFilterDraft } from "./access-events-view.helpers"
import type { AccessEventItem, ListAccessEventsResult } from "@/lib/access-events/types"
import { Route } from "@/routes/access-events"
import { listAccessEvents } from "@/lib/access-events/service"
import { ApiError } from "@/lib/api/types"
import { useSession } from "@/lib/auth/session-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"

type AccessEventsViewProps = {
  initialData: ListAccessEventsResult | null
}

export function AccessEventsView({ initialData }: AccessEventsViewProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canRead = permissions.includes("access_events.read")
  const canMap = permissions.includes("access_events.map")

  const [events, setEvents] = useState<Array<AccessEventItem>>(initialData?.events ?? [])
  const [total, setTotal] = useState(initialData?.page.total ?? 0)
  const [tableLoading, setTableLoading] = useState(!initialData)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AccessEventsFilterDraft>(DEFAULT_FILTERS)
  const [draftLimit, setDraftLimit] = useState(search.limit)

  const firstLoadSkippedRef = useRef(Boolean(initialData))
  const tableSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDraftFilters(fromSearchToDraft(search))
    setDraftLimit(search.limit)
  }, [search])

  useEffect(() => {
    if (!initialData) {
      return
    }
    setEvents(initialData.events)
    setTotal(initialData.page.total)
  }, [initialData])

  const unmatchedCount = useMemo(
    () => events.filter((event) => event.status === "UNMATCHED").length,
    [events]
  )
  const rangeStart = total === 0 ? 0 : search.offset + 1
  const rangeEnd = total === 0 ? 0 : Math.min(search.offset + events.length, total)
  const appliedFiltersCount = useMemo(
    () => countAppliedFilters(draftFilters, search.limit),
    [draftFilters, search.limit]
  )
  const currentPage = Math.floor(search.offset / search.limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / search.limit))
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const scrollToTable = useCallback(() => {
    tableSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const load = useCallback(async () => {
    setError(null)
    setTableLoading(true)
    try {
      const response = await listAccessEvents(toListAccessEventsInput(search))
      setEvents(response.events)
      setTotal(response.page.total)
    } catch (value) {
      if (value instanceof ApiError && value.code === "server_unreachable") {
        await router.navigate({ to: "/unavailable" })
        return
      }
      setError(value instanceof Error ? value.message : t("accessEvents.failedToLoad"))
    } finally {
      setTableLoading(false)
    }
  }, [router, search, t])

  useEffect(() => {
    if (!canRead) {
      setTableLoading(false)
      return
    }

    if (firstLoadSkippedRef.current) {
      firstLoadSkippedRef.current = false
      setTableLoading(false)
      return
    }

    void load()
  }, [canRead, load])

  const onApplyFilters = useCallback(async () => {
    await navigate({
      search: {
        ...search,
        limit: draftLimit,
        offset: 0,
        status: draftFilters.status,
        direction: draftFilters.direction,
        deviceId: draftFilters.deviceId.trim(),
        iin: draftFilters.iin.trim(),
        terminalPersonId: draftFilters.terminalPersonId.trim(),
        from: draftFilters.from.trim(),
        to: draftFilters.to.trim()
      }
    })

    setFiltersOpen(false)
    scrollToTable()
  }, [draftFilters, draftLimit, navigate, scrollToTable, search])

  const onResetFilters = useCallback(async () => {
    await navigate({
      search: {
        limit: 20,
        offset: 0,
        status: "all",
        direction: "all",
        deviceId: "",
        iin: "",
        terminalPersonId: "",
        from: "",
        to: ""
      }
    })
    scrollToTable()
  }, [navigate, scrollToTable])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const onMapped = useCallback(async () => {
    await load()
  }, [load])

  const goToPage = useCallback(async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return
    }

    await navigate({
      search: {
        ...search,
        offset: (nextPage - 1) * search.limit
      }
    })
    scrollToTable()
  }, [currentPage, navigate, scrollToTable, search, totalPages])

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t("settings.accessDeniedTitle")}</AlertTitle>
        <AlertDescription>
          {t("accessEvents.accessDeniedDescription")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("app.nav.accessEvents")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("accessEvents.subtitle")}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={refreshing || tableLoading} onClick={() => void onRefresh()}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? t("common.actions.refreshing") : t("common.actions.refresh")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("accessEvents.totalFilteredEvents")}</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("accessEvents.unmatchedOnPage")}</CardDescription>
            <CardTitle className="text-2xl">{unmatchedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("accessEvents.mappingCapability")}</CardDescription>
            <CardTitle className="text-base">
              <Badge variant={canMap ? "default" : "outline"}>
                {canMap ? t("accessEvents.mappingGranted") : t("dashboard.readOnly")}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AccessEventsFilters
        filtersOpen={filtersOpen}
        appliedFiltersCount={appliedFiltersCount}
        draftFilters={draftFilters}
        draftLimit={draftLimit}
        onFiltersOpenChange={setFiltersOpen}
        onDraftFiltersChange={(updater) => setDraftFilters((prev) => updater(prev))}
        onDraftLimitChange={setDraftLimit}
        onApplyFilters={(event) => {
          event.preventDefault()
          return onApplyFilters()
        }}
        onResetFilters={onResetFilters}
      />

      <div id="access-events-table" ref={tableSectionRef}>
        <Card>
          <CardHeader>
            <CardTitle>{t("accessEvents.eventsStream")}</CardTitle>
            <CardDescription>
              {t("accessEvents.eventsRange", { from: rangeStart, to: rangeEnd, total })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
                <AlertTitle>{t("accessEvents.failedToLoad")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <AccessEventsTable events={events} loading={tableLoading} canMap={canMap} onMapped={onMapped} />

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious disabled={!canGoPrev || tableLoading} onClick={() => void goToPage(currentPage - 1)} />
                </PaginationItem>
                {paginationItems.map((item, index) => (
                  <PaginationItem key={`${String(item)}-${index}`}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#access-events-table"
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
                  <PaginationNext disabled={!canGoNext || tableLoading} onClick={() => void goToPage(currentPage + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      </div>

      {!canMap ? (
        <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Link2 className="h-3.5 w-3.5" />
            {t("accessEvents.mappingRestricted")}
          </p>
          <p className="mt-1">
            {t("accessEvents.mappingRestrictedDescription")}
          </p>
        </div>
      ) : null}
    </div>
  )
}
