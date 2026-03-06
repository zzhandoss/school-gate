import { Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PersonsUpsertPanel } from './persons-upsert-panel'
import type { PersonItem, UpdatePersonInput } from '@/lib/persons/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  deleting: boolean
  selectedPersonIds: Record<string, boolean>
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  onToggleSelected: (personId: string, checked: boolean) => void
  onToggleAllVisible: (checked: boolean) => void
  onRequestDeletePerson: (person: PersonItem) => void
  onUpdatePerson: (personId: string, input: UpdatePersonInput) => Promise<void>
}

function formatPersonName(person: PersonItem) {
  const chunks = [person.firstName, person.lastName].filter(Boolean)
  return chunks.length > 0 ? chunks.join(' ') : ''
}

export function PersonsTable({
  persons,
  canWrite,
  deleting,
  selectedPersonIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleSelected,
  onToggleAllVisible,
  onRequestDeletePerson,
  onUpdatePerson
}: PersonsTableProps) {
  const { t, i18n } = useTranslation()
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{t('app.nav.persons')}</h2>
          <p className="text-xs text-muted-foreground">{t('persons.tableDescription')}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label={t('persons.selection.selectPage')}
                  checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                  disabled={persons.length === 0 || deleting}
                  onChange={(event) => onToggleAllVisible(event.currentTarget.checked)}
                />
              </TableHead>
              <TableHead>{t('common.labels.iin')}</TableHead>
              <TableHead>{t('common.labels.name')}</TableHead>
              <TableHead>{t('persons.terminalLinks')}</TableHead>
              <TableHead>{t('common.labels.created')}</TableHead>
              <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {t('persons.noPersonsFound')}
                </TableCell>
              </TableRow>
            ) : (
              persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={t('persons.selection.selectPerson', { iin: person.iin })}
                      checked={selectedPersonIds[person.id] ?? false}
                      disabled={deleting}
                      onChange={(event) => onToggleSelected(person.id, event.currentTarget.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{person.iin}</TableCell>
                  <TableCell>{formatPersonName(person) || t('persons.unknownName')}</TableCell>
                  <TableCell>
                    {person.hasDeviceIdentities ? (
                      <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-700">
                        {t('persons.linked')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                        {t('persons.notLinked')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(person.createdAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-GB')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/persons/$personId" params={{ personId: person.id }}>
                        <Button type="button" size="sm" variant="outline">
                          {t('persons.open')}
                        </Button>
                      </Link>
                      <PersonsUpsertPanel
                        mode="edit"
                        person={person}
                        canWrite={canWrite}
                        onSubmit={(input) => onUpdatePerson(person.id, input as UpdatePersonInput)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={!canWrite || deleting}
                        onClick={() => onRequestDeletePerson(person)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('persons.delete')}
                      </Button>
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
