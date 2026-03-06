import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

type PersonsPageStateProps =
  | {
      kind: 'accessDenied'
    }
  | {
      kind: 'loading'
    }
  | {
      kind: 'error'
      message: string
    }

export function PersonsPageState(props: PersonsPageStateProps) {
  const { t } = useTranslation()

  if (props.kind === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (props.kind === 'accessDenied') {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>{t('persons.accessDeniedDescription')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
      <AlertTitle>{t('persons.pageLoadFailedTitle')}</AlertTitle>
      <AlertDescription>{props.message}</AlertDescription>
    </Alert>
  )
}
