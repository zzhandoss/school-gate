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

type PersonDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleting: boolean
  count: number
  personName?: string | null
  onConfirm: () => void
}

export function PersonDeleteDialog({
  open,
  onOpenChange,
  deleting,
  count,
  personName,
  onConfirm
}: PersonDeleteDialogProps) {
  const { t } = useTranslation()
  const isBulk = count > 1

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? t('persons.deleteDialog.bulkTitle') : t('persons.deleteDialog.singleTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? t('persons.deleteDialog.bulkDescription', { count })
              : t('persons.deleteDialog.singleDescription', {
                  name: personName?.trim() || t('persons.unknownName')
                })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{t('persons.deleteDialog.effects.identities')}</p>
          <p>{t('persons.deleteDialog.effects.subscriptions')}</p>
          <p>{t('persons.deleteDialog.effects.requests')}</p>
          <p>{t('persons.deleteDialog.effects.snapshot')}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t('common.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting
              ? t('persons.deleting')
              : isBulk
                ? t('persons.deleteDialog.confirmBulk')
                : t('persons.deleteDialog.confirmSingle')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
