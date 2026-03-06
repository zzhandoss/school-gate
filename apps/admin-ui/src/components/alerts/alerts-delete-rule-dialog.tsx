import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

type AlertsDeleteRuleDialogProps = {
  open: boolean
  deleting: boolean
  ruleName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function AlertsDeleteRuleDialog({
  open,
  deleting,
  ruleName,
  onOpenChange,
  onConfirm
}: AlertsDeleteRuleDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('alerts.deleteDialog.title', { defaultValue: 'Delete alert rule?' })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('alerts.deleteDialog.description', {
              name: ruleName,
              defaultValue: 'Rule "{{name}}" will be permanently deleted.'
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {t('alerts.deleteDialog.warning', {
              defaultValue: 'This action cannot be undone.'
            })}
          </p>
          <p>{t('alerts.deleteDialog.effects.subscriptions', { defaultValue: 'All subscriptions for this rule will also be deleted.' })}</p>
          <p>{t('alerts.deleteDialog.effects.events', { defaultValue: 'All Recent Events history linked to this rule will also be deleted.' })}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t('common.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            {deleting
              ? t('alerts.deletingRule', { defaultValue: 'Deleting...' })
              : t('alerts.deleteRule', { defaultValue: 'Delete' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
