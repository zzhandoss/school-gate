import { useState } from 'react'
import { Pencil } from 'lucide-react'

import { AlertsEditRuleForm } from './alerts-edit-rule-form'
import type { AlertRule } from '@/lib/alerts/types'
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

type AlertsEditRulePanelProps = {
  rule: AlertRule
  onUpdated: () => Promise<void>
  canEdit: boolean
}

export function AlertsEditRulePanel({ rule, onUpdated, canEdit }: AlertsEditRulePanelProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="hidden sm:inline-flex"
        disabled={!canEdit}
        onClick={() => setIsDesktopOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="sm:hidden"
        aria-label={`Edit ${rule.name}`}
        disabled={!canEdit}
        onClick={() => setIsMobileOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Sheet open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit alert rule</SheetTitle>
            <SheetDescription>
              Update rule metadata and thresholds without leaving alerts overview.
            </SheetDescription>
          </SheetHeader>
          <AlertsEditRuleForm
            rule={rule}
            onUpdated={onUpdated}
            onClose={() => setIsDesktopOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit alert rule</DrawerTitle>
            <DrawerDescription>
              Update rule settings and save changes.
            </DrawerDescription>
          </DrawerHeader>
          <AlertsEditRuleForm
            rule={rule}
            onUpdated={onUpdated}
            onClose={() => setIsMobileOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
