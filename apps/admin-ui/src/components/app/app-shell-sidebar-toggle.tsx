import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type AppShellSidebarToggleProps = {
  isDesktopCollapsed: boolean
}

export function AppShellSidebarToggle({
  isDesktopCollapsed
}: AppShellSidebarToggleProps) {
  const { t } = useTranslation()

  return (
    <SidebarTrigger
      className={cn(
        'absolute top-7 z-30 hidden -translate-y-1/2 rounded-full border border-border/70 bg-card/95 text-sidebar-foreground shadow-none backdrop-blur transition-[left,transform,background-color,color] duration-300 hover:-translate-y-[calc(50%+1px)] hover:bg-card hover:text-foreground md:inline-flex',
        isDesktopCollapsed
          ? 'left-[calc(var(--sidebar-width-icon)-1.375rem)]'
          : 'left-[calc(var(--sidebar-width)-1.375rem)]'
      )}
      aria-label={
        isDesktopCollapsed
          ? t('app.shell.expandSidebar')
          : t('app.shell.collapseSidebar')
      }
      title={
        isDesktopCollapsed
          ? t('app.shell.expandSidebar')
          : t('app.shell.collapseSidebar')
      }
    >
      {isDesktopCollapsed ? (
        <ChevronsRight className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
      )}
    </SidebarTrigger>
  )
}
