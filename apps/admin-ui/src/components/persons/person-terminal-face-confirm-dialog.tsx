import { ImageUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { PersonItem } from '@/lib/persons/types'
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

type PersonTerminalFaceConfirmDialogProps = {
  open: boolean
  person: PersonItem
  devices: Array<string>
  previewUrl: string
  pending: boolean
  title: string
  description: string
  actionLabel: string
  warningLabel: string
  warningDescription: string
  devicesTitle: string
  previewTitle: string
  personTitle: string
  previewAlt: string
  onCancel: () => void
  onConfirm: () => void
}

function formatPersonName(person: PersonItem) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim() || person.iin
}

export function PersonTerminalFaceConfirmDialog({
  open,
  person,
  devices,
  previewUrl,
  pending,
  title,
  description,
  actionLabel,
  warningLabel,
  warningDescription,
  devicesTitle,
  previewTitle,
  personTitle,
  previewAlt,
  onCancel,
  onConfirm
}: PersonTerminalFaceConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && !pending) {
        onCancel()
      }
    }}>
      <AlertDialogContent className="sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">{warningLabel}</p>
            <p className="mt-1 text-sm/6">{warningDescription}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {previewTitle}
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-background/60">
                <img src={previewUrl} alt={previewAlt} className="h-72 w-full object-cover" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {personTitle}
                </p>
                <div className="mt-3 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm">
                  <p className="font-medium">{formatPersonName(person)}</p>
                  <p className="text-xs text-muted-foreground">{t('common.labels.iin')}: {person.iin}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {devicesTitle}
                </p>
                <ul className="mt-3 space-y-2">
                  {devices.map((device) => (
                    <li key={device} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                      <ImageUp className="h-4 w-4 text-muted-foreground" />
                      <span>{device}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} onClick={onCancel}>
            {t('common.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={onConfirm}
            className="bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
