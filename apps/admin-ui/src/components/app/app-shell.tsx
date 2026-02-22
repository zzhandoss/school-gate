import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  LogOut,
  School,
  Shield,
  UserCircle2,
  X
} from 'lucide-react'

import { useSession } from '@/lib/auth/session-store'
import { logout } from '@/lib/auth/service'
import { buildBreadcrumbs } from '@/lib/navigation/breadcrumbs'
import { buildSidebarNavigation } from '@/lib/navigation/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'

type AppShellProps = {
  children: React.ReactNode
}

export function getSidebarBrandingVariant(isDesktopCollapsed: boolean): 'full' | 'compact' {
  return isDesktopCollapsed ? 'compact' : 'full'
}

export function AppShell({ children }: AppShellProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const location = useLocation()
  const session = useSession()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const adminEmail = session?.admin.email ?? 'unknown@school-gate.local'
  const adminRole = session?.admin.roleName ?? session?.admin.roleId ?? 'unknown'
  const adminName = session?.admin.name?.trim() || adminEmail
  const sidebarBrandingVariant = getSidebarBrandingVariant(isDesktopCollapsed)
  const navLabelClass = `overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out ${
    isDesktopCollapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[12rem] opacity-100 translate-x-0'
  }`
  const sectionLabelClass = `overflow-hidden px-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase transition-[max-height,opacity,transform] duration-300 ease-out ${
    isDesktopCollapsed ? 'max-h-0 opacity-0 -translate-x-1' : 'max-h-6 opacity-100 translate-x-0'
  }`
  const avatarInitials = useMemo(() => {
    const source = session?.admin.name?.trim() || session?.admin.email || 'SA'
    const chunks = source.split(/\s+/).filter(Boolean)
    if (chunks.length >= 2) {
      return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
  }, [session?.admin.email, session?.admin.name])
  const sidebarGroups = useMemo(
    () =>
      buildSidebarNavigation({
        pathname: location.pathname,
        permissions: session?.admin.permissions ?? []
      }),
    [location.pathname, session?.admin.permissions]
  )
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(location.pathname, session?.admin.permissions ?? []),
    [location.pathname, session?.admin.permissions]
  )

  useEffect(() => {
    function onDocumentPointerDown(event: MouseEvent) {
      if (!profileMenuRef.current) {
        return
      }
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

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
      <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top_left,#f7f3e8,transparent_42%),radial-gradient(circle_at_bottom_right,#dff2ef,transparent_40%),#f8fafc]">
        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-0">
            <div className="flex items-center justify-between gap-2">
              <div className="relative h-10 flex-1">
                <div
                  className={`absolute inset-0 flex flex-col justify-center overflow-hidden transition-[opacity,transform] duration-300 ease-out ${
                    sidebarBrandingVariant === 'compact'
                      ? 'pointer-events-none opacity-0 translate-x-1'
                      : 'opacity-100 translate-x-0'
                  }`}
                  aria-hidden={sidebarBrandingVariant === 'compact'}
                >
                  <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                    {t('app.brand.schoolGate')}
                  </p>
                  <h2 className="text-xl font-semibold">
                    {t('app.brand.adminUi')}
                  </h2>
                </div>
                <div>
                  <div
                    aria-label="School Gate"
                    title={t('app.brand.schoolGate')}
                    className={`absolute inset-0 hidden items-center justify-center transition-[opacity,transform] duration-300 ease-out md:flex ${
                      sidebarBrandingVariant === 'compact'
                        ? 'opacity-100 translate-x-0'
                        : 'pointer-events-none opacity-0 -translate-x-1'
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/80 text-foreground">
                      <School className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={t('app.shell.closeMenu')}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <Separator className="my-5" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {sidebarGroups.map((group, index) => (
                <div key={group.id} className={index === 0 ? undefined : 'pt-1'}>
                  <p className={sectionLabelClass} aria-hidden={isDesktopCollapsed}>
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.isActive(location.pathname)}
                          title={isDesktopCollapsed ? item.label : undefined}
                        >
                          <Link to={item.to}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className={navLabelClass} aria-hidden={isDesktopCollapsed}>
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </div>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
              <div
                className={`mt-auto overflow-hidden rounded-md bg-background/80 transition-[max-height,opacity,transform,padding,border-color] duration-300 ease-out ${
                  isDesktopCollapsed
                    ? 'max-h-0 border border-transparent p-0 opacity-0 -translate-y-1'
                    : 'max-h-24 border border-border/60 p-3 opacity-100 translate-y-0'
                }`}
                aria-hidden={isDesktopCollapsed}
              >
                <p className="text-xs text-muted-foreground">{t('app.shell.signedInAs')}</p>
                <p className="truncate text-sm font-medium">{adminEmail}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  {t('app.shell.role')}: {adminRole}
                </p>
              </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="md:hidden" aria-label={t('app.shell.openMenu')} />
            <SidebarTrigger
              className="hidden md:inline-flex"
              aria-label={isDesktopCollapsed ? t('app.shell.expandSidebar') : t('app.shell.collapseSidebar')}
            />
          {breadcrumbs.length > 0 ? (
            <nav aria-label={t('app.shell.breadcrumb')} className="min-w-0 overflow-hidden">
              <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <li key={`${breadcrumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                      {breadcrumb.to && !isLast ? (
                        <Link to={breadcrumb.to} className="truncate hover:text-foreground">
                          {breadcrumb.label}
                        </Link>
                      ) : (
                        <span className={`truncate ${isLast ? 'font-medium text-foreground' : ''}`}>
                          {breadcrumb.label}
                        </span>
                      )}
                      {!isLast ? <span className="text-muted-foreground/70">/</span> : null}
                    </li>
                  )
                })}
              </ol>
            </nav>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">{t('app.shell.operationsOverview')}</p>
          )}
          <div className="ml-auto" ref={profileMenuRef}>
            <Button
              variant="ghost"
              className="h-10 gap-3 rounded-full border border-border/70 bg-background/90 px-2 hover:bg-muted/70"
              onClick={() => setIsProfileMenuOpen((value) => !value)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {avatarInitials}
              </span>
              <span className="hidden text-left md:flex md:flex-col">
                <span className="max-w-40 truncate text-sm font-medium text-foreground">
                  {adminName}
                </span>
                <span className="max-w-40 truncate text-xs text-muted-foreground">
                  {adminRole}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </Button>

            {isProfileMenuOpen ? (
              <div className="absolute right-6 mt-2 w-64 rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {avatarInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{adminName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {adminEmail}
                    </p>
                  </div>
                </div>
                <div className="my-1 h-px bg-border/70" />
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t('app.shell.role')}: <span className="font-medium text-foreground">{adminRole}</span>
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t('app.shell.language')}: <span className="font-medium text-foreground">{i18n.resolvedLanguage === 'ru' ? t('app.language.ru') : t('app.language.en')}</span>
                </div>
                <div className="flex gap-1 px-2 pb-1">
                  <Button
                    variant={i18n.resolvedLanguage === 'ru' ? 'default' : 'outline'}
                    className="h-8 flex-1"
                    onClick={() => {
                      void i18n.changeLanguage('ru')
                    }}
                  >
                    RU
                  </Button>
                  <Button
                    variant={i18n.resolvedLanguage === 'en' ? 'default' : 'outline'}
                    className="h-8 flex-1"
                    onClick={() => {
                      void i18n.changeLanguage('en')
                    }}
                  >
                    EN
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    void router.navigate({ to: '/profile' })
                  }}
                >
                  <UserCircle2 className="h-4 w-4" />
                  {t('app.nav.profile')}
                </Button>
                <div className="my-1 h-px bg-border/70" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={isLoggingOut}
                  onClick={async () => {
                    setIsProfileMenuOpen(false)
                    await onLogout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? t('app.shell.signingOut') : t('app.shell.signOut')}
                </Button>
              </div>
            ) : null}
          </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
