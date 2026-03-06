import { Link2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

type PersonsSelectionBarProps = {
  count: number
  disabled?: boolean
  canBulkCreate?: boolean
  onClear: () => void
  onBulkCreate?: () => void
  onDelete: () => void
}

export function PersonsSelectionBar({
  count,
  disabled = false,
  canBulkCreate = false,
  onClear,
  onBulkCreate,
  onDelete
}: PersonsSelectionBarProps) {
  const { t } = useTranslation()

  if (count <= 0) {
    return null
  }

    return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">
        {t('persons.selection.selected', { count })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={disabled} onClick={onClear}>
          {t('persons.selection.clear')}
        </Button>
        {canBulkCreate && onBulkCreate ? (
          <Button type="button" variant="outline" disabled={disabled} onClick={onBulkCreate}>
            <Link2 className="h-4 w-4" />
            {t('persons.selection.linkToTerminal')}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="destructive" disabled={disabled} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          {t('persons.selection.delete')}
        </Button>
      </div>
    </div>
  )
}
