import { Link } from '@tanstack/react-router'
import { Home, LayoutDashboard, ListChecks, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const { t } = useTranslation()
  return (
    <header className="border-b border-border/70 bg-card">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          <Home className="h-4 w-4" />
          {t('app.nav.main')}
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          <LayoutDashboard className="h-4 w-4" />
          {t('app.nav.dashboard')}
        </Link>
        <Link
          to="/access-events"
          search={{ limit: 20, offset: 0, status: 'all', direction: 'all', deviceId: '', iin: '', terminalPersonId: '', from: '', to: '' }}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          <ListChecks className="h-4 w-4" />
          {t('app.nav.accessEvents')}
        </Link>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
          {t('app.nav.settings')}
        </Link>
      </nav>
    </header>
  )
}
