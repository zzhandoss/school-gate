import { School, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SidebarBrandingVariant } from './app-shell.utils'
import { Button } from '@/components/ui/button'

type AppShellSidebarBrandProps = {
  variant: SidebarBrandingVariant
  onCloseMobileMenu: () => void
}

export function AppShellSidebarBrand({
  variant,
  onCloseMobileMenu
}: AppShellSidebarBrandProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="relative h-10 flex-1">
        <div
          className={`absolute inset-0 flex flex-col justify-center overflow-hidden transition-[opacity,transform] duration-300 ease-out ${
            variant === 'compact'
              ? 'pointer-events-none opacity-0 translate-x-1'
              : 'opacity-100 translate-x-0'
          }`}
          aria-hidden={variant === 'compact'}
        >
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            {t('app.brand.schoolGate')}
          </p>
          <h2 className="text-xl font-semibold">{t('app.brand.adminUi')}</h2>
        </div>
        <div
          aria-label={t('app.brand.schoolGate')}
          title={t('app.brand.schoolGate')}
          className={`absolute inset-0 hidden items-center justify-center transition-[opacity,transform] duration-300 ease-out md:flex ${
            variant === 'compact'
              ? 'opacity-100 translate-x-0'
              : 'pointer-events-none opacity-0 -translate-x-1'
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/80 text-foreground">
            <School className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t('app.shell.closeMenu')}
        onClick={onCloseMobileMenu}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  )
}
