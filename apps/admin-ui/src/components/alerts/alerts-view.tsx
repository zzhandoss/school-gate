import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, BellRing, RefreshCw, Siren, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AlertsEventsCard } from './alerts-events-card'
import { AlertsCreateRulePanel } from './alerts-create-rule-panel'
import { AlertsRulesCard } from './alerts-rules-card'
import type { AlertEvent, AlertRule, AlertSubscription } from '@/lib/alerts/types'
import { Route } from '@/routes/alerts'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import {
  getAlertEvents,
  getAlertRules,
  getMyAlertSubscriptions,
  setMyAlertSubscription
} from '@/lib/alerts/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AlertsView() {
  const { t } = useTranslation()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const session = useSession()
  const [rules, setRules] = useState<Array<AlertRule>>([])
  const [events, setEvents] = useState<Array<AlertEvent>>([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [subscriptions, setSubscriptions] = useState<Array<AlertSubscription>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionUpdatingRuleId, setSubscriptionUpdatingRuleId] = useState<string | null>(null)
  const firstEventsLoadSkippedRef = useRef(false)

  const adminId = session?.admin.id ?? null
  const canManageSubscriptions = session?.admin.permissions.includes('admin.manage') ?? false

  const subscriptionsByRuleId = useMemo(() => {
    const map = new Map<string, AlertSubscription>()
    for (const subscription of subscriptions) {
      map.set(subscription.ruleId, subscription)
    }
    return map
  }, [subscriptions])

  async function loadRules(activeRef?: { current: boolean }) {
    if (!adminId) {
      setError(t('alerts.sessionMissingAdminId'))
      return
    }

    setError(null)
    setSubscriptionError(null)

    try {
      const [nextRules, nextSubscriptions] = await Promise.all([
        getAlertRules({ limit: 100 }),
        getMyAlertSubscriptions(adminId)
      ])

      if (activeRef && !activeRef.current) {
        return
      }

      setRules(nextRules)
      setSubscriptions(nextSubscriptions)
    } catch (value) {
      if (activeRef && !activeRef.current) {
        return
      }

      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      const message = value instanceof Error ? value.message : t('alerts.loadFailed')
      setError(message)
    }
  }

  async function loadEvents(activeRef?: { current: boolean }) {
    setError(null)
    setEventsLoading(true)

    try {
      const result = await getAlertEvents({
        limit: search.eventsLimit,
        offset: search.eventsOffset
      })

      if (activeRef && !activeRef.current) {
        return
      }

      setEvents(result.events)
      setEventsTotal(result.page.total)
    } catch (value) {
      if (activeRef && !activeRef.current) {
        return
      }

      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      const message = value instanceof Error ? value.message : t('alerts.loadFailed')
      setError(message)
    } finally {
      if (!activeRef || activeRef.current) {
        setEventsLoading(false)
      }
    }
  }

  useEffect(() => {
    const activeRef = { current: true }

    async function initialLoad() {
      setLoading(true)
      await Promise.all([loadRules(activeRef), loadEvents(activeRef)])
      if (activeRef.current) {
        firstEventsLoadSkippedRef.current = true
        setLoading(false)
      }
    }

    void initialLoad()
    return () => {
      activeRef.current = false
    }
  }, [adminId, router])

  useEffect(() => {
    if (loading || !adminId) {
      return
    }
    if (firstEventsLoadSkippedRef.current) {
      firstEventsLoadSkippedRef.current = false
      return
    }
    void loadEvents()
  }, [search.eventsLimit, search.eventsOffset])

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([loadRules(), loadEvents()])
    setRefreshing(false)
  }

  async function onToggleSubscription(ruleId: string) {
    if (!adminId) {
      return
    }

    const current = subscriptionsByRuleId.get(ruleId)?.isEnabled ?? false
    setSubscriptionError(null)
    setSubscriptionUpdatingRuleId(ruleId)
    try {
      await setMyAlertSubscription({
        adminId,
        ruleId,
        isEnabled: !current
      })
      await loadRules()
    } catch (value) {
      const message = value instanceof Error ? value.message : t('alerts.cannotUpdateSubscription')
      setSubscriptionError(message)
    } finally {
      setSubscriptionUpdatingRuleId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('alerts.pageLoadFailedTitle')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const triggeredCount = events.filter((item) => item.status === 'triggered').length
  const criticalTriggeredCount = events.filter(
    (item) => item.status === 'triggered' && item.severity === 'critical'
  ).length
  const enabledRulesCount = rules.filter((item) => item.isEnabled).length

  async function onEventsPageChange(page: number) {
    await navigate({
      search: {
        ...search,
        eventsOffset: (page - 1) * search.eventsLimit
      }
    })
  }

  async function onEventsPageSizeChange(limit: number) {
    await navigate({
      search: {
        ...search,
        eventsLimit: limit,
        eventsOffset: 0
      }
    })
  }

  async function onRulesChanged() {
    await Promise.all([loadRules(), loadEvents()])
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('alerts.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('alerts.subtitle')}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <AlertsCreateRulePanel onCreated={onRulesChanged} canCreate={canManageSubscriptions} />
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={onRefresh}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('common.actions.refreshing') : t('alerts.refreshData')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>{t('alerts.triggeredNow')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Siren className="h-5 w-5 text-red-700" />
              {triggeredCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>{t('alerts.criticalActive')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TriangleAlert className="h-5 w-5 text-red-700" />
              {criticalTriggeredCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>{t('alerts.enabledRules')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BellRing className="h-5 w-5 text-cyan-700" />
              {enabledRulesCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AlertsRulesCard
        rules={rules}
        subscriptionsByRuleId={subscriptionsByRuleId}
        canManageSubscriptions={canManageSubscriptions}
        subscriptionError={subscriptionError}
        subscriptionUpdatingRuleId={subscriptionUpdatingRuleId}
        onToggleSubscription={onToggleSubscription}
        onRuleUpdated={loadRules}
        onRuleDeleted={onRulesChanged}
      />

      <AlertsEventsCard
        events={events}
        page={{
          limit: search.eventsLimit,
          offset: search.eventsOffset,
          total: eventsTotal
        }}
        loading={eventsLoading || refreshing}
        onPageChange={(page) => void onEventsPageChange(page)}
        onPageSizeChange={(limit) => void onEventsPageSizeChange(limit)}
      />

      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t('alerts.deliveryScopeTitle')}
        </p>
        <p className="mt-1">
          {t('alerts.deliveryScopeDescription')}
        </p>
      </div>
    </div>
  )
}
