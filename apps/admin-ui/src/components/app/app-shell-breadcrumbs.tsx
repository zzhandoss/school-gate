import { Link } from '@tanstack/react-router'

import type { AppBreadcrumb } from '@/lib/navigation/breadcrumbs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

type AppShellBreadcrumbsProps = {
  breadcrumbs: Array<AppBreadcrumb>
  fallbackLabel: string
}

export function AppShellBreadcrumbs({
  breadcrumbs,
  fallbackLabel
}: AppShellBreadcrumbsProps) {
  if (breadcrumbs.length === 0) {
    return <p className="text-sm font-medium text-muted-foreground">{fallbackLabel}</p>
  }

  return (
    <Breadcrumb className="min-w-0 overflow-hidden">
      <BreadcrumbList className="min-w-0 flex-nowrap">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return [
            (
              <BreadcrumbItem key={`${breadcrumb.label}-${index}`} className="min-w-0 shrink">
                {breadcrumb.to && !isLast ? (
                  <BreadcrumbLink asChild className="truncate">
                    <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate font-medium">{breadcrumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ),
            !isLast ? <BreadcrumbSeparator key={`${breadcrumb.label}-${index}-separator`} /> : null
          ]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
