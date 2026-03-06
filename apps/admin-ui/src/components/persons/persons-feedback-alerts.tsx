import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type PersonsFeedbackAlertsProps = {
  mutationError: string | null
  successMessage: string | null
}

export function PersonsFeedbackAlerts({
  mutationError,
  successMessage
}: PersonsFeedbackAlertsProps) {
  const { t } = useTranslation()

  return (
    <>
      {mutationError ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
          <AlertTitle>{t('persons.actionCompletedTitle')}</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}
    </>
  )
}
