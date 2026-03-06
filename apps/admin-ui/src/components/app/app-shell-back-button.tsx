import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

const PERSONS_INDEX_SEARCH = {
  limit: 20,
  offset: 0,
  iin: '',
  query: '',
  linkedStatus: 'all' as const,
  includeDeviceIds: '',
  excludeDeviceIds: ''
}

export function getAppShellBackFallback(pathname: string) {
  if (pathname === '/persons/import' || /^\/persons\/(?!import$)[^/]+$/.test(pathname)) {
    return {
      to: '/persons' as const,
      search: PERSONS_INDEX_SEARCH
    }
  }

  return null
}

type AppShellBackButtonProps = {
  pathname: string
}

export function AppShellBackButton({ pathname }: AppShellBackButtonProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const fallback = getAppShellBackFallback(pathname)

  if (!fallback) {
    return null
  }

  const navigationFallback = fallback

  async function onBack() {
    if (canGoBack) {
      router.history.back()
      return
    }

    await router.navigate(navigationFallback)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0 rounded-full border border-transparent bg-foreground/[0.035] text-foreground/82 shadow-none backdrop-blur transition-[transform,background-color,color] duration-200 hover:-translate-y-px hover:bg-foreground/[0.06] hover:text-foreground"
      aria-label={t('app.shell.goBack')}
      title={t('app.shell.goBack')}
      onClick={() => {
        void onBack()
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t('app.shell.goBack')}</span>
    </Button>
  )
}
