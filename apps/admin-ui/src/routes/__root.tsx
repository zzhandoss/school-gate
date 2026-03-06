import { HeadContent, Scripts, createRootRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'

import appCss from '../styles.css?url'
import { clearSession, setSession } from '@/lib/auth/session-store'
import { resolveSessionServerFn } from '@/lib/auth/session.server'
import { i18n } from '@/lib/i18n'
import { QueryProvider } from '@/components/providers/query-provider'
import { FallbackPage } from '@/components/system/fallback-page'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isPublicPath =
      location.pathname === '/login' ||
      location.pathname === '/bootstrap/first-admin' ||
      location.pathname === '/invite' ||
      location.pathname === '/password-reset/request' ||
      location.pathname === '/password-reset/confirm' ||
      location.pathname === '/unavailable'

    const { session, unavailable } = await resolveSessionServerFn()
    if (unavailable) {
      if (location.pathname !== '/unavailable') {
        throw redirect({ to: '/unavailable' })
      }
      return { session: null }
    }

    if (isPublicPath) {
      return { session }
    }

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  notFoundComponent: () => (
    <FallbackPage
      variant="not_found"
      title={i18n.t('fallback.pageNotFoundTitle')}
      description={i18n.t('fallback.pageNotFoundDescription')}
    />
  ),
  errorComponent: ({ error }) => (
    <FallbackPage
      variant="error"
      title={i18n.t('fallback.errorTitle')}
      description={
        error instanceof Error
          ? error.message
          : i18n.t('fallback.errorDescription')
      }
    />
  ),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'School Gate Admin',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { t, i18n: i18nClient } = useTranslation()
  const { session } = Route.useRouteContext()

  useEffect(() => {
    if (session) {
      setSession(session)
      return
    }
    clearSession()
  }, [session])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = i18nClient.resolvedLanguage === 'kz' ? 'kz' : i18nClient.resolvedLanguage === 'ru' ? 'ru' : 'en'
    }
  }, [i18nClient.resolvedLanguage])

  return (
    <html lang={i18nClient.resolvedLanguage === 'kz' ? 'kz' : i18nClient.resolvedLanguage === 'ru' ? 'ru' : 'en'}>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryProvider>
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm text-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {t('fallback.skipToContent')}
          </a>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Toaster richColors position="top-right" />
          <Scripts />
        </QueryProvider>
      </body>
    </html>
  )
}
