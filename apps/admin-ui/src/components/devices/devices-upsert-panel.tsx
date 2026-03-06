import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus } from 'lucide-react'

import { DevicesUpsertForm } from './devices-upsert-form'
import type { DeviceAdapterItem, DeviceItem, DeviceUpdateInput, DeviceUpsertInput } from '@/lib/devices/types'
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

type DevicesUpsertPanelProps = {
  mode: 'create' | 'edit'
  device?: DeviceItem
  adapters: Array<DeviceAdapterItem>
  canWrite: boolean
  onSubmit: (input: DeviceUpsertInput | DeviceUpdateInput) => Promise<void>
}

export function DevicesUpsertPanel({ mode, device, adapters, canWrite, onSubmit }: DevicesUpsertPanelProps) {
  const { t } = useTranslation()
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const title = mode === 'create' ? t('devices.panel.createTitle') : t('devices.panel.editTitle')
  const description = mode === 'create'
    ? t('devices.panel.createDescription')
    : t('devices.panel.editDescription')

  return (
    <>
      {mode === 'create' ? (
        <>
          <Button
            type="button"
            className="hidden sm:inline-flex"
            disabled={!canWrite}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('devices.panel.addDevice')}
          </Button>
          <Button
            type="button"
            className="h-10 flex-[1.35] sm:hidden"
            disabled={!canWrite}
            onClick={() => setIsMobileOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('devices.panel.add')}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={!canWrite}
            onClick={() => setIsDesktopOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('devices.panel.edit')}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="sm:hidden"
            aria-label={t('devices.panel.editAria', { value: device?.name ?? t('common.labels.device') })}
            disabled={!canWrite}
            onClick={() => setIsMobileOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="flex h-[100dvh] w-full flex-col p-0 sm:max-w-xl">
          <SheetHeader className="shrink-0 border-b border-border/70">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <DevicesUpsertForm
              mode={mode}
              initialDevice={device}
              adapters={adapters}
              canWrite={canWrite}
              onSubmit={onSubmit}
              onClose={() => setIsDesktopOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent className="flex max-h-[90dvh] flex-col p-0">
          <DrawerHeader className="shrink-0 border-b border-border/70">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1">
            <DevicesUpsertForm
              mode={mode}
              initialDevice={device}
              adapters={adapters}
              canWrite={canWrite}
              onSubmit={onSubmit}
              onClose={() => setIsMobileOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
