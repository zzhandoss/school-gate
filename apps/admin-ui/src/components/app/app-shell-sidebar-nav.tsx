import { Link } from '@tanstack/react-router'

import type { SidebarNavGroup } from '@/lib/navigation/sidebar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

type AppShellSidebarNavProps = {
  groups: Array<SidebarNavGroup>
  pathname: string
  isDesktopCollapsed: boolean
}

export function AppShellSidebarNav({
  groups,
  pathname,
  isDesktopCollapsed
}: AppShellSidebarNavProps) {
  const navLabelClass = `overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out ${
    isDesktopCollapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[12rem] opacity-100 translate-x-0'
  }`
  const sectionLabelClass = `overflow-hidden px-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase transition-[max-height,opacity,transform] duration-300 ease-out ${
    isDesktopCollapsed ? 'max-h-0 opacity-0 -translate-x-1' : 'max-h-6 opacity-100 translate-x-0'
  }`

  return (
    <SidebarMenu>
      {groups.map((group, index) => (
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
                  isActive={item.isActive(pathname)}
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
  )
}
