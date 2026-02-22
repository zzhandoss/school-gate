import { createFileRoute } from '@tanstack/react-router'

import { FallbackPage } from '@/components/system/fallback-page'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/unavailable')({
  component: UnavailablePage
})

function UnavailablePage() {
  return (
    <FallbackPage
      variant="unavailable"
      title={i18n.t('fallback.unavailableTitle')}
      description={i18n.t('fallback.unavailableDescription')}
    />
  )
}
