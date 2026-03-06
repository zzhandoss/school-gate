import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ShellAdminIdentity } from './app-shell.utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

type AppShellProfileDropdownProps = {
  identity: ShellAdminIdentity
  isLoggingOut: boolean
  onOpenProfile: () => void
  onLogout: () => Promise<void>
}

export function AppShellProfileDropdown({
  identity,
  isLoggingOut,
  onOpenProfile,
  onLogout
}: AppShellProfileDropdownProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 min-w-[15.5rem] justify-between gap-3 rounded-2xl border border-border/60 bg-background/90 pl-2 pr-2 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.65)] backdrop-blur hover:bg-background"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Avatar size="default" className="border border-primary/10 bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {identity.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 text-left md:flex md:flex-col">
              <span className="max-w-40 truncate text-sm font-medium text-foreground">
                {identity.name}
              </span>
              <span className="max-w-max rounded-full bg-muted/75 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {identity.role}
              </span>
            </span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/75 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
        <DropdownMenuLabel className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar size="lg" className="bg-primary/15 text-primary">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {identity.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{identity.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {identity.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1 text-xs font-normal text-muted-foreground">
          {t('app.shell.role')}: <span className="font-medium text-foreground">{identity.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            onOpenProfile()
          }}
        >
          <UserCircle2 className="h-4 w-4" />
          {t('app.nav.profile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onSelect={() => {
            void onLogout()
          }}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? t('app.shell.signingOut') : t('app.shell.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
