import { useState } from 'react'
import { Plus } from 'lucide-react'

import { AlertsCreateRuleForm } from './alerts-create-rule-form'
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

type AlertsCreateRulePanelProps = {
  onCreated: () => Promise<void>
  canCreate: boolean
}

export function AlertsCreateRulePanel({ onCreated, canCreate }: AlertsCreateRulePanelProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        className="hidden sm:inline-flex"
        disabled={!canCreate}
        onClick={() => setIsDesktopOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Create rule
      </Button>
      <Button
        type="button"
        className="sm:hidden"
        disabled={!canCreate}
        onClick={() => setIsMobileOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Create
      </Button>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create alert rule</SheetTitle>
            <SheetDescription>
              Define a rule that will generate alert events from monitoring snapshots.
            </SheetDescription>
          </SheetHeader>
          <AlertsCreateRuleForm
            onCreated={onCreated}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create alert rule</DrawerTitle>
            <DrawerDescription>
              Configure rule type, severity, and trigger thresholds.
            </DrawerDescription>
          </DrawerHeader>
          <AlertsCreateRuleForm
            onCreated={onCreated}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
