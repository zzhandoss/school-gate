import { AlertTriangle } from 'lucide-react'
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

type TerminalWriteSummaryField = {
  label: string
  value: string
}

type PersonTerminalWriteConfirmDialogProps = {
  open: boolean
  mode: "create" | "update"
  person: PersonItem
  devices: Array<string>
  fields: Array<TerminalWriteSummaryField>
  pending: boolean
  title: string
  description: string
  actionLabel: string
  warningLabel: string
  warningDescription: string
  fieldsTitle: string
  devicesTitle: string
  onCancel: () => void
  onConfirm: () => void
}

export function PersonTerminalWriteConfirmDialog({
  open,
  mode,
  person,
  devices,
  fields,
  pending,
  title,
  description,
  actionLabel,
  warningLabel,
  warningDescription,
  fieldsTitle,
  devicesTitle,
  onCancel,
  onConfirm
}: PersonTerminalWriteConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && !pending) {
        onCancel()
      }
    }}>
      <AlertDialogContent className="sm:max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-500/15 p-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">{warningLabel}</p>
            <p className="mt-1 text-sm/6">{warningDescription}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {fieldsTitle}
              </p>
              <dl className="mt-3 space-y-2">
                {fields.map((field) => (
                  <div key={field.label} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 text-sm">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="break-all font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {devicesTitle}
              </p>
              <div className="mt-3 space-y-2">
                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm">
                  <p className="font-medium">{person.firstName || person.lastName ? [person.firstName, person.lastName].filter(Boolean).join(' ') : person.iin}</p>
                  <p className="text-xs text-muted-foreground">{t('common.labels.iin')}: {person.iin}</p>
                </div>
                <ul className="space-y-2">
                  {devices.map((device) => (
                    <li key={`${mode}-${device}`} className="rounded-md border border-border/60 px-3 py-2 text-sm">
                      {device}
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
            className={mode === 'create'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300'}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
