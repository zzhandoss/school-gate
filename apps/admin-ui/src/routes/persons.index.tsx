import { createFileRoute } from '@tanstack/react-router'

import { PersonsView } from '@/components/persons/persons-view'

type PersonsSearch = {
  limit?: number
  offset?: number
  iin?: string
  query?: string
}

const LIMIT_OPTIONS = new Set([20, 50, 100])

export const Route = createFileRoute('/persons/')({
  validateSearch: (search: PersonsSearch) => {
    const limit = Number(search.limit)
    const offset = Number(search.offset)

    return {
      limit: Number.isInteger(limit) && LIMIT_OPTIONS.has(limit) ? limit : 20,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      iin: typeof search.iin === 'string' ? search.iin.trim() : '',
      query: typeof search.query === 'string' ? search.query.trim() : ''
    } as const
  },
  component: PersonsPage
})

function PersonsPage() {
  return <PersonsView />
}
