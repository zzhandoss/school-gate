import { createFileRoute } from '@tanstack/react-router'

import { PersonDetailsView } from '@/components/persons/person-details-view'

export const Route = createFileRoute('/persons/$personId')({
  component: PersonDetailsPage
})

function PersonDetailsPage() {
  const { personId } = Route.useParams()
  return <PersonDetailsView personId={personId} />
}
