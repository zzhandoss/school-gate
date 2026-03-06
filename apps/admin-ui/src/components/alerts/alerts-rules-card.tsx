import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertsDeleteRuleDialog } from './alerts-delete-rule-dialog'
import { AlertsEditRulePanel } from './alerts-edit-rule-panel'
import { formatAlertDate, severityBadgeClass } from './alerts-format'
import type { AlertRule, AlertSubscription } from '@/lib/alerts/types'
import { deleteAlertRule } from '@/lib/alerts/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  onRuleDeleted: () => Promise<void>
}

export function AlertsRulesCard(props: AlertsRulesCardProps) {
  const { t } = useTranslation()
  const {
    rules,
    subscriptionsByRuleId,
    canManageSubscriptions,
    subscriptionError,
    subscriptionUpdatingRuleId,
    onToggleSubscription,
    onRuleUpdated,
    onRuleDeleted
  } = props
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [deleteRuleError, setDeleteRuleError] = useState<string | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<AlertRule | null>(null)

  async function onConfirmDelete() {
    if (!ruleToDelete) {
      return
    }

    setDeleteRuleError(null)
    setDeletingRuleId(ruleToDelete.id)
    try {
      await deleteAlertRule(ruleToDelete.id)
      await onRuleDeleted()
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    } catch (value) {
      setDeleteRuleError(
        value instanceof Error
          ? value.message
          : t('alerts.deleteRuleFailed', { defaultValue: 'Failed to delete alert rule.' })
      )
    } finally {
      setDeletingRuleId(null)
    }
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>{t('alerts.rulesTitle')}</CardTitle>
        <CardDescription>
          {t('alerts.rulesDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscriptionError ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>{t('alerts.subscriptionUpdateFailedTitle')}</AlertTitle>
            <AlertDescription>{subscriptionError}</AlertDescription>
          </Alert>
        ) : null}
        {deleteRuleError ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>{t('alerts.deleteRuleFailedTitle', { defaultValue: 'Rule delete failed' })}</AlertTitle>
            <AlertDescription>{deleteRuleError}</AlertDescription>
          </Alert>
        ) : null}
        {!canManageSubscriptions ? (
          <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
            <AlertTitle>{t('alerts.limitedAccessTitle')}</AlertTitle>
            <AlertDescription>
              {t('alerts.limitedAccessDescription')}
            </AlertDescription>
          </Alert>
        ) : null}
        {rules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('alerts.noRulesConfigured')}
          </div>
        ) : (
          <div className="rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('alerts.table.rule')}</TableHead>
                  <TableHead>{t('alerts.table.severity')}</TableHead>
                  <TableHead>{t('common.labels.status')}</TableHead>
                  <TableHead>{t('alerts.table.notifyMe')}</TableHead>
                  <TableHead>{t('common.labels.actions')}</TableHead>
                  <TableHead className="text-right">{t('devices.updated')}</TableHead>
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
                          {t(`alerts.severity.${rule.severity}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.isEnabled ? t('settings.enabled') : t('settings.disabled')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isSubscribed}
                            disabled={!canManageSubscriptions || isUpdating}
                            onCheckedChange={() => void onToggleSubscription(rule.id)}
                            aria-label={t('alerts.toggleNotificationFor', { name: rule.name })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {isUpdating ? t('settings.saving') : isSubscribed ? t('alerts.subscribed') : t('alerts.off')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertsEditRulePanel
                            rule={rule}
                            canEdit={canManageSubscriptions}
                            onUpdated={onRuleUpdated}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={!canManageSubscriptions || deletingRuleId === rule.id}
                            onClick={() => {
                              setRuleToDelete(rule)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('alerts.deleteRule', { defaultValue: 'Delete' })}
                          </Button>
                        </div>
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

      <AlertsDeleteRuleDialog
        open={deleteDialogOpen}
        deleting={Boolean(deletingRuleId)}
        ruleName={ruleToDelete?.name ?? t('alerts.unknownRule', { defaultValue: 'Unknown rule' })}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open && !deletingRuleId) {
            setRuleToDelete(null)
          }
        }}
        onConfirm={() => void onConfirmDelete()}
      />
    </Card>
  )
}
