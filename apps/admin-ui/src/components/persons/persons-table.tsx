import { Link } from '@tanstack/react-router'

import { PersonsUpsertPanel } from './persons-upsert-panel'
import type { CreatePersonWithAutoIdentitiesInput, PersonItem, UpdatePersonInput } from '@/lib/persons/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type PersonsTableProps = {
  persons: Array<PersonItem>
  canWrite: boolean
  onUpdatePerson: (personId: string, input: UpdatePersonInput) => Promise<void>
  onCreatePerson: (input: CreatePersonWithAutoIdentitiesInput) => Promise<void>
}

function formatPersonName(person: PersonItem) {
  const chunks = [person.firstName, person.lastName].filter(Boolean)
  return chunks.length > 0 ? chunks.join(' ') : 'Unknown name'
}

export function PersonsTable({
  persons,
  canWrite,
  onUpdatePerson,
  onCreatePerson
}: PersonsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Persons</h2>
          <p className="text-xs text-muted-foreground">Manage person profiles and open identities page.</p>
        </div>
        <PersonsUpsertPanel
          mode="create"
          canWrite={canWrite}
          onSubmit={(input) => onCreatePerson(input as CreatePersonWithAutoIdentitiesInput)}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IIN</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Terminal links</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No persons found.
                </TableCell>
              </TableRow>
            ) : (
              persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.iin}</TableCell>
                  <TableCell>{formatPersonName(person)}</TableCell>
                  <TableCell>
                    {person.hasDeviceIdentities ? (
                      <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-700">
                        Linked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                        Not linked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(person.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/persons/$personId" params={{ personId: person.id }}>
                        <Button type="button" size="sm" variant="outline">
                          Open
                        </Button>
                      </Link>
                      <PersonsUpsertPanel
                        mode="edit"
                        person={person}
                        canWrite={canWrite}
                        onSubmit={(input) => onUpdatePerson(person.id, input as UpdatePersonInput)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
