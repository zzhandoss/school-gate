import { Link } from '@tanstack/react-router'
import { AlertTriangle, Home, RefreshCcw, ServerOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type FallbackVariant = 'not_found' | 'unavailable' | 'error'

type FallbackPageProps = {
  title: string
  description: string
  variant: FallbackVariant
}

const iconByVariant = {
  not_found: AlertTriangle,
  unavailable: ServerOff,
  error: AlertTriangle
} as const

export function FallbackPage({ title, description, variant }: FallbackPageProps) {
  const { t } = useTranslation()
  const Icon = iconByVariant[variant]

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f9e8c8,transparent_40%),radial-gradient(circle_at_bottom,#d7f2ec,transparent_38%),#f8fafc] p-6">
      <Card className="w-full max-w-lg border-border/70 shadow-lg transition-shadow duration-200 hover:shadow-xl">
        <CardHeader className="items-center text-center">
          <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className={cn(buttonVariants({ variant: 'default' }), 'sm:flex-1')}
          >
            <Home className="h-4 w-4" />
            {t('fallback.dashboard')}
          </Link>
          <Button
            type="button"
            variant="outline"
            className="sm:flex-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4" />
            {t('fallback.reload')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
