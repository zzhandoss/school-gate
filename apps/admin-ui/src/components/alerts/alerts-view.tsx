import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, BellRing, RefreshCw, Siren, TriangleAlert } from 'lucide-react'

import { AlertsEventsCard } from './alerts-events-card'
import { AlertsCreateRulePanel } from './alerts-create-rule-panel'
import { AlertsRulesCard } from './alerts-rules-card'
import type { AlertEvent, AlertRule, AlertSubscription } from '@/lib/alerts/types'
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
  const router = useRouter()
  const session = useSession()
  const [rules, setRules] = useState<Array<AlertRule>>([])
  const [events, setEvents] = useState<Array<AlertEvent>>([])
  const [subscriptions, setSubscriptions] = useState<Array<AlertSubscription>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionUpdatingRuleId, setSubscriptionUpdatingRuleId] = useState<string | null>(null)

  const adminId = session?.admin.id ?? null
  const canManageSubscriptions = session?.admin.permissions.includes('admin.manage') ?? false

  const subscriptionsByRuleId = useMemo(() => {
    const map = new Map<string, AlertSubscription>()
    for (const subscription of subscriptions) {
      map.set(subscription.ruleId, subscription)
    }
    return map
  }, [subscriptions])

  async function load(activeRef?: { current: boolean }) {
    if (!adminId) {
      setError('Session is missing admin identifier.')
      return
    }

    setError(null)
    setSubscriptionError(null)

    try {
      const [nextRules, nextEvents, nextSubscriptions] = await Promise.all([
        getAlertRules({ limit: 100 }),
        getAlertEvents({ limit: 30 }),
        getMyAlertSubscriptions(adminId)
      ])

      if (activeRef && !activeRef.current) {
        return
      }

      setRules(nextRules)
      setEvents(nextEvents)
      setSubscriptions(nextSubscriptions)
    } catch (value) {
      if (activeRef && !activeRef.current) {
        return
      }

      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }

      const message = value instanceof Error ? value.message : 'Failed to load alerts'
      setError(message)
    }
  }

  useEffect(() => {
    const activeRef = { current: true }

    async function initialLoad() {
      setLoading(true)
      await load(activeRef)
      if (activeRef.current) {
        setLoading(false)
      }
    }

    void initialLoad()
    return () => {
      activeRef.current = false
    }
  }, [adminId, router])

  async function onRefresh() {
    setRefreshing(true)
    await load()
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
      await load()
    } catch (value) {
      const message = value instanceof Error ? value.message : 'Cannot update subscription'
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
        <AlertTitle>Alerts page failed to load</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const triggeredCount = events.filter((item) => item.status === 'triggered').length
  const criticalTriggeredCount = events.filter(
    (item) => item.status === 'triggered' && item.severity === 'critical'
  ).length
  const enabledRulesCount = rules.filter((item) => item.isEnabled).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Alerts control center</h1>
          <p className="text-sm text-muted-foreground">
            Manage rules and notification subscriptions for your account.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <AlertsCreateRulePanel onCreated={load} canCreate={canManageSubscriptions} />
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={onRefresh}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh data'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Triggered now</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Siren className="h-5 w-5 text-red-700" />
              {triggeredCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Critical active</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TriangleAlert className="h-5 w-5 text-red-700" />
              {criticalTriggeredCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Enabled rules</CardDescription>
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
        onRuleUpdated={load}
      />

      <AlertsEventsCard events={events} />

      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Delivery scope
        </p>
        <p className="mt-1">
          This page supports creating, editing, and subscribing to rules in one workflow.
        </p>
      </div>
    </div>
  )
}
