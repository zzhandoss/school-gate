import { Link } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

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
}

function personDisplayName(person: PersonHoverCardData) {
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
  return fullName || person.iin
}

export function PersonHoverCard({ person, children, align = 'start' }: PersonHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align={align} className="space-y-2 text-xs">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <UserRound className="h-3.5 w-3.5" />
          {personDisplayName(person)}
        </p>
        <p className="text-muted-foreground">IIN: {person.iin}</p>
        <p className="text-muted-foreground">Person ID: {person.id}</p>
        {person.terminalPersonId !== undefined ? (
          <p className="text-muted-foreground">Terminal: {person.terminalPersonId ?? '-'}</p>
        ) : null}
        <Link to="/persons/$personId" params={{ personId: person.id }}>
          <Button type="button" size="sm" variant="outline">
            Open profile
          </Button>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}
