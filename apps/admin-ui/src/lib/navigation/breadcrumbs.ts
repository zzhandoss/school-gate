import { buildSidebarNavigation } from './sidebar'
import { i18n } from '@/lib/i18n'

export type AppBreadcrumb = {
  label: string
  to?: string
}

function findSidebarItemLabel(pathname: string, permissions: Array<string>) {
  const groups = buildSidebarNavigation({ pathname, permissions })
  for (const group of groups) {
    for (const item of group.items) {
      if (item.isActive(pathname)) {
        return item.label
      }
    }
  }
  return null
}

function prettifySegment(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function buildBreadcrumbs(pathname: string, permissions: Array<string>): Array<AppBreadcrumb> {
  if (pathname === '/dashboard') {
    return []
  }

  if (pathname === '/profile') {
    return [{ label: i18n.t('app.nav.profile') }]
  }

  if (pathname.startsWith('/persons/')) {
    return [
      { label: i18n.t('app.nav.persons'), to: '/persons' },
      { label: i18n.t('app.nav.profile') }
    ]
  }

  const sidebarLabel = findSidebarItemLabel(pathname, permissions)
  if (sidebarLabel) {
    return [{ label: sidebarLabel }]
  }

  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) {
    return []
  }

  const breadcrumbs: Array<AppBreadcrumb> = []
  let currentPath = ''
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]
    currentPath += `/${part}`
    const isLast = index === parts.length - 1
    breadcrumbs.push({
      label: prettifySegment(part),
      ...(isLast ? {} : { to: currentPath })
    })
  }

  return breadcrumbs
}
