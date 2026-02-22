import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AccessEventsMapForm } from './access-events-map-form'
import type { UnmatchedAccessEventItem } from '@/lib/access-events/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type AccessEventsMapPanelProps = {
  event: UnmatchedAccessEventItem
  canMap: boolean
  onMapped: () => Promise<void>
}

export function AccessEventsMapPanel({ event, canMap, onMapped }: AccessEventsMapPanelProps) {
  const { t } = useTranslation()
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={!canMap}
            aria-label={t('accessEvents.mapEventAria', { eventId: event.id })}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{canMap ? t('accessEvents.mapTerminalIdentity') : t('accessEvents.missingMapPermission')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="sm:hidden"
            disabled={!canMap}
            aria-label={t('accessEvents.mapEventAria', { eventId: event.id })}
            onClick={() => setIsMobileOpen(true)}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{canMap ? t('accessEvents.mapTerminalIdentity') : t('accessEvents.missingMapPermission')}</TooltipContent>
      </Tooltip>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('accessEvents.mapTerminalIdentity')}</SheetTitle>
            <SheetDescription>
              {t('accessEvents.mapTerminalIdentityDescription')}
            </SheetDescription>
          </SheetHeader>
          <AccessEventsMapForm
            event={event}
            canMap={canMap}
            onMapped={onMapped}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accessEvents.mapTerminalIdentity')}</DrawerTitle>
            <DrawerDescription>
              {t('accessEvents.mapTerminalIdentityDescriptionMobile')}
            </DrawerDescription>
          </DrawerHeader>
          <AccessEventsMapForm
            event={event}
            canMap={canMap}
            onMapped={onMapped}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
