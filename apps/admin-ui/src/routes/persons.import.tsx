import { createFileRoute } from '@tanstack/react-router'

import { PersonsImportView } from '@/components/persons/persons-import-view'

export const Route = createFileRoute('/persons/import')({
  component: PersonsImportPage
})

function PersonsImportPage() {
  return <PersonsImportView />
}
