import { Link } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { getPerson } from '@/lib/persons/service'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'

type PersonHoverCardData = {
  id: string
  iin: string
  firstName?: string | null
  lastName?: string | null
  terminalPersonId?: string | null
}

type PersonHoverCardProps = {
  person: PersonHoverCardData
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  loadDetails?: boolean
}

function personDisplayName(person: PersonHoverCardData) {
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
  return fullName || person.iin
}

export function PersonHoverCard({ person, children, align = 'start', loadDetails = false }: PersonHoverCardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState<PersonHoverCardData | null>(null)

  useEffect(() => {
    if (!open || !loadDetails) {
      return
    }
    if (loaded || person.firstName || person.lastName) {
      return
    }

    let isActive = true
    setIsLoading(true)
    void getPerson(person.id)
      .then((resolved) => {
        if (!isActive) {
          return
        }
        setLoaded({
          id: resolved.id,
          iin: resolved.iin,
          firstName: resolved.firstName,
          lastName: resolved.lastName,
          terminalPersonId: resolved.terminalPersonId
        })
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [loadDetails, loaded, open, person.firstName, person.id, person.lastName])

  const resolvedPerson = useMemo(() => {
    if (!loaded) {
      return person
    }
    return {
      ...person,
      ...loaded
    }
  }, [loaded, person])

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align={align} className="space-y-2 text-xs">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <UserRound className="h-3.5 w-3.5" />
          {personDisplayName(resolvedPerson)}
        </p>
        <p className="text-muted-foreground">{t('common.labels.iin')}: {resolvedPerson.iin}</p>
        <p className="text-muted-foreground">{t('common.labels.personId')}: {resolvedPerson.id}</p>
        {isLoading ? (
          <p className="text-muted-foreground">{t('common.actions.searching')}</p>
        ) : null}
        {resolvedPerson.terminalPersonId !== undefined ? (
          <p className="text-muted-foreground">{t('common.labels.terminal')}: {resolvedPerson.terminalPersonId ?? '-'}</p>
        ) : null}
        <Link to="/persons/$personId" params={{ personId: person.id }}>
          <Button type="button" size="sm" variant="outline">
            {t('personHover.openProfile')}
          </Button>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}
