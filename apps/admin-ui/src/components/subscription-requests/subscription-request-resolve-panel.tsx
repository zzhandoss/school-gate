import { useState } from 'react'
import { UserRoundCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SubscriptionRequestResolveForm } from './subscription-request-resolve-form'
import type { SubscriptionRequestItem } from '@/lib/subscription-requests/types'
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

type SubscriptionRequestResolvePanelProps = {
  request: SubscriptionRequestItem
  canResolve: boolean
  onResolve: (requestId: string, personId: string) => Promise<void>
}

export function SubscriptionRequestResolvePanel({
  request,
  canResolve,
  onResolve
}: SubscriptionRequestResolvePanelProps) {
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
            disabled={!canResolve}
            aria-label={t('subscriptionRequests.resolveRequestAria', { requestId: request.id })}
            onClick={() => setIsDesktopOpen(true)}
          >
            <UserRoundCheck className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('common.actions.resolve')}</TooltipContent>
      </Tooltip>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="sm:hidden"
        disabled={!canResolve}
        aria-label={t('subscriptionRequests.resolveRequestAria', { requestId: request.id })}
        onClick={() => setIsMobileOpen(true)}
      >
        <UserRoundCheck className="h-3.5 w-3.5" />
      </Button>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('subscriptionRequests.resolvePanelTitle')}</SheetTitle>
            <SheetDescription>
              {t('subscriptionRequests.resolvePanelDescriptionDesktop')}
            </SheetDescription>
          </SheetHeader>
          <SubscriptionRequestResolveForm
            request={request}
            canResolve={canResolve}
            onResolve={onResolve}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('subscriptionRequests.resolvePanelTitle')}</DrawerTitle>
            <DrawerDescription>
              {t('subscriptionRequests.resolvePanelDescriptionMobile')}
            </DrawerDescription>
          </DrawerHeader>
          <SubscriptionRequestResolveForm
            request={request}
            canResolve={canResolve}
            onResolve={onResolve}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
