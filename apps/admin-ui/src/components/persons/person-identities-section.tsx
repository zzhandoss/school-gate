import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PersonIdentityAutoDialog } from './person-identity-auto-dialog'
import { PersonIdentityPanel } from './person-identity-panel'
import type { PersonIdentityItem, UpsertPersonIdentityInput } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type PersonIdentitiesSectionProps = {
  personId: string
  personIin: string
  devices: Array<DeviceItem>
  identities: Array<PersonIdentityItem>
  canWrite: boolean
  deletingIdentityId: string | null
  onCreateIdentity: (input: UpsertPersonIdentityInput) => Promise<void>
  onUpdateIdentity: (identityId: string, input: UpsertPersonIdentityInput) => Promise<void>
  onDeleteIdentity: (identityId: string) => Promise<void>
  onApplied: () => Promise<void>
}

export function PersonIdentitiesSection({
  personId,
  personIin,
  devices,
  identities,
  canWrite,
  deletingIdentityId,
  onCreateIdentity,
  onUpdateIdentity,
  onDeleteIdentity,
  onApplied
}: PersonIdentitiesSectionProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{t('persons.deviceIdentities')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('persons.deviceIdentitiesDescription')}
          </p>
        </div>
        <Link to="/persons/import">
          <Button type="button" variant="outline">
            {t('persons.importActions.sync')}
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('persons.deviceId')}</TableHead>
              <TableHead>{t('persons.terminalPersonId')}</TableHead>
              <TableHead>{t('common.labels.created')}</TableHead>
              <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {identities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  {t('persons.noIdentitiesForPerson')}
                </TableCell>
              </TableRow>
            ) : (
              identities.map((identity) => (
                <TableRow key={identity.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{devices.find((device) => device.deviceId === identity.deviceId)?.name ?? identity.deviceId}</p>
                      <p className="text-xs text-muted-foreground">{identity.deviceId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {identity.terminalPersonId}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(identity.createdAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-GB')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PersonIdentityPanel
                        mode="edit"
                        identity={identity}
                        devices={devices}
                        canWrite={canWrite}
                        onSubmit={(input) => onUpdateIdentity(identity.id, input)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canWrite || deletingIdentityId === identity.id}
                        onClick={() => void onDeleteIdentity(identity.id)}
                      >
                        {deletingIdentityId === identity.id ? t('persons.deleting') : t('persons.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Collapsible className="border-t border-border/70">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium">
            <span>{t('persons.advancedIdentityMapping')}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border/70 bg-muted/20 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <PersonIdentityAutoDialog personId={personId} canWrite={canWrite} onApplied={onApplied} />
          </div>
          <PersonIdentityPanel
            mode="create"
            personIin={personIin}
            devices={devices}
            canWrite={canWrite}
            onSubmit={onCreateIdentity}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
