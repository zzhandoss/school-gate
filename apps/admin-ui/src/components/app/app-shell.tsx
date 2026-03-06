import { useMemo, useState } from 'react'
import { useLocation, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AppShellBreadcrumbs } from './app-shell-breadcrumbs'
import { AppShellBackButton } from './app-shell-back-button'
import { AppShellLanguageSwitcher } from './app-shell-language-switcher'
import { AppShellProfileDropdown } from './app-shell-profile-dropdown'
import { AppShellSidebarToggle } from './app-shell-sidebar-toggle'
import { AppShellSidebarAccountSummary } from './app-shell-sidebar-account-summary'
import { AppShellSidebarBrand } from './app-shell-sidebar-brand'
import { AppShellSidebarNav } from './app-shell-sidebar-nav'
import {
  getShellAdminIdentity,
  getSidebarBrandingVariant
} from './app-shell.utils'
import { useSession } from '@/lib/auth/session-store'
import { logout } from '@/lib/auth/service'
import { buildBreadcrumbs } from '@/lib/navigation/breadcrumbs'
import { buildSidebarNavigation } from '@/lib/navigation/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const location = useLocation()
  const session = useSession()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  const identity = useMemo(() => getShellAdminIdentity(session), [session])
  const sidebarBrandingVariant = getSidebarBrandingVariant(isDesktopCollapsed)
  const sidebarGroups = useMemo(
    () =>
      buildSidebarNavigation({
        pathname: location.pathname,
        permissions: session?.admin.permissions ?? []
      }),
    [i18n.resolvedLanguage, location.pathname, session?.admin.permissions]
  )
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(location.pathname, session?.admin.permissions ?? []),
    [i18n.resolvedLanguage, location.pathname, session?.admin.permissions]
  )

  async function onLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    try {
      await logout()
      await router.navigate({ to: '/login', replace: true })
      await router.invalidate()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarProvider
      open={!isDesktopCollapsed}
      onOpenChange={(isOpen) => setIsDesktopCollapsed(!isOpen)}
      openMobile={isMobileSidebarOpen}
      onOpenMobileChange={setIsMobileSidebarOpen}
    >
      <div className="relative flex min-h-screen w-full bg-[radial-gradient(circle_at_top_left,#f7f3e8,transparent_42%),radial-gradient(circle_at_bottom_right,#dff2ef,transparent_40%),#f8fafc]">
        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-0">
            <AppShellSidebarBrand
              variant={sidebarBrandingVariant}
              onCloseMobileMenu={() => setIsMobileSidebarOpen(false)}
            />
            <Separator className="my-5" />
          </SidebarHeader>

          <SidebarContent className="overflow-hidden">
            <AppShellSidebarNav
              groups={sidebarGroups}
              pathname={location.pathname}
              isDesktopCollapsed={isDesktopCollapsed}
            />
          </SidebarContent>

          <SidebarFooter>
            <AppShellSidebarAccountSummary
              email={identity.email}
              role={identity.role}
              isDesktopCollapsed={isDesktopCollapsed}
            />
          </SidebarFooter>
        </Sidebar>
        <AppShellSidebarToggle isDesktopCollapsed={isDesktopCollapsed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="md:hidden" aria-label={t('app.shell.openMenu')} />
            <AppShellBackButton pathname={location.pathname} />
            <AppShellBreadcrumbs
              breadcrumbs={breadcrumbs}
              fallbackLabel={t('app.shell.operationsOverview')}
            />
            <div className="ml-auto flex items-center gap-2">
              <AppShellLanguageSwitcher />
              <AppShellProfileDropdown
                identity={identity}
                isLoggingOut={isLoggingOut}
                onOpenProfile={() => {
                  void router.navigate({ to: '/profile' })
                }}
                onLogout={onLogout}
              />
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
