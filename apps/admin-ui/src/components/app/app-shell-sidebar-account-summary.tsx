import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type AppShellSidebarAccountSummaryProps = {
  email: string
  role: string
  isDesktopCollapsed: boolean
}

export function AppShellSidebarAccountSummary({
  email,
  role,
  isDesktopCollapsed
}: AppShellSidebarAccountSummaryProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`mt-auto overflow-hidden rounded-md bg-background/80 transition-[max-height,opacity,transform,padding,border-color] duration-300 ease-out ${
        isDesktopCollapsed
          ? 'max-h-0 border border-transparent p-0 opacity-0 -translate-y-1'
          : 'max-h-24 border border-border/60 p-3 opacity-100 translate-y-0'
      }`}
      aria-hidden={isDesktopCollapsed}
    >
      <p className="text-xs text-muted-foreground">{t('app.shell.signedInAs')}</p>
      <p className="truncate text-sm font-medium">{email}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        {t('app.shell.role')}: {role}
      </p>
    </div>
  )
}
