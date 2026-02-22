import { AlertsEditRulePanel } from './alerts-edit-rule-panel'
import { formatAlertDate, severityBadgeClass } from './alerts-format'
import type { AlertRule, AlertSubscription } from '@/lib/alerts/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type AlertsRulesCardProps = {
  rules: Array<AlertRule>
  subscriptionsByRuleId: Map<string, AlertSubscription>
  canManageSubscriptions: boolean
  subscriptionError: string | null
  subscriptionUpdatingRuleId: string | null
  onToggleSubscription: (ruleId: string) => Promise<void>
  onRuleUpdated: () => Promise<void>
}

export function AlertsRulesCard(props: AlertsRulesCardProps) {
  const {
    rules,
    subscriptionsByRuleId,
    canManageSubscriptions,
    subscriptionError,
    subscriptionUpdatingRuleId,
    onToggleSubscription,
    onRuleUpdated
  } = props

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>
          Turn personal notifications on or off per rule without changing global rule config.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscriptionError ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Subscription update failed</AlertTitle>
            <AlertDescription>{subscriptionError}</AlertDescription>
          </Alert>
        ) : null}
        {!canManageSubscriptions ? (
          <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
            <AlertTitle>Limited access</AlertTitle>
            <AlertDescription>
              You do not have `admin.manage` permission, so subscription toggles are read-only.
            </AlertDescription>
          </Alert>
        ) : null}
        {rules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            No alert rules configured yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Rule</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notify me</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const isSubscribed = subscriptionsByRuleId.get(rule.id)?.isEnabled ?? false
                  const isUpdating = subscriptionUpdatingRuleId === rule.id

                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severityBadgeClass(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.isEnabled ? 'enabled' : 'disabled'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isSubscribed}
                            disabled={!canManageSubscriptions || isUpdating}
                            onCheckedChange={() => void onToggleSubscription(rule.id)}
                            aria-label={`Toggle notification for ${rule.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {isUpdating ? 'Saving...' : isSubscribed ? 'Subscribed' : 'Off'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AlertsEditRulePanel
                          rule={rule}
                          canEdit={canManageSubscriptions}
                          onUpdated={onRuleUpdated}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatAlertDate(rule.updatedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
