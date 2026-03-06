import { Fragment, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { PersonsImportStatusBadge } from './persons-import-status'
import type { ColumnDef, ExpandedState, RowSelectionState } from '@tanstack/react-table'
import type { PersonImportCandidateGroup } from '@/lib/persons/types'
import type { DeviceItem } from '@/lib/devices/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PersonsImportTableProps = {
  groups: Array<PersonImportCandidateGroup>
  devices: Array<DeviceItem>
  statusLabels: Record<PersonImportCandidateGroup['status'], string>
  strings: {
    suggestedAction: string
    terminalUsers: string
    warnings: string
    linkedPerson: string
    devices: string
    details: string
    stale: string
    lastSeen: string
    source: string
    statusLabel: string
    card: string
    validity: string
    emptyTitle: string
    emptyDescription: string
  }
  rowSelection: RowSelectionState
  onRowSelectionChange: (state: RowSelectionState) => void
  expanded: ExpandedState
  onExpandedChange: (state: ExpandedState) => void
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function PersonsImportTable({
  groups,
  devices,
  statusLabels,
  strings,
  rowSelection,
  onRowSelectionChange,
  expanded,
  onExpandedChange
}: PersonsImportTableProps) {
  const deviceNameMap = useMemo(
    () => new Map(devices.map((device) => [device.deviceId, device.name])),
    [devices]
  )

  const columns = useMemo<Array<ColumnDef<PersonImportCandidateGroup>>>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            aria-label="Select all import groups"
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            ref={(node) => {
              if (node) {
                node.indeterminate = table.getIsSomePageRowsSelected()
              }
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            aria-label={`Select ${row.original.groupKey}`}
            type="checkbox"
            checked={row.getIsSelected()}
            ref={(node) => {
              if (node) {
                node.indeterminate = row.getIsSomeSelected()
              }
            }}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        id: 'details',
        header: strings.details,
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )
      },
      {
        accessorKey: 'status',
        header: strings.statusLabel,
        cell: ({ row }) => (
          <PersonsImportStatusBadge
            status={row.original.status}
            label={statusLabels[row.original.status]}
          />
        )
      },
      {
        id: 'identity',
        header: strings.terminalUsers,
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.displayName ?? 'Unknown terminal user'}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.iin ?? 'No IIN'} · {row.original.entries.length} {strings.devices.toLowerCase()}
            </div>
          </div>
        )
      },
      {
        id: 'suggestedAction',
        header: strings.suggestedAction,
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="text-sm">
              {row.original.suggestedPersonName ?? 'New person'}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.suggestedPersonIin ?? row.original.iin ?? 'No IIN'}
            </div>
          </div>
        )
      },
      {
        id: 'warnings',
        header: strings.warnings,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.warnings.length === 0 ? (
              <span className="text-xs text-muted-foreground">-</span>
            ) : (
              row.original.warnings.map((warning) => (
                <Badge key={warning} variant="outline" className="text-xs">
                  {warning}
                </Badge>
              ))
            )}
          </div>
        )
      }
    ],
    [statusLabels, strings]
  )

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.groupKey,
    enableRowSelection: true,
    state: {
      rowSelection,
      expanded
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      onRowSelectionChange(next)
    },
    onExpandedChange: (updater) => {
      const next = typeof updater === 'function' ? updater(expanded) : updater
      onExpandedChange(next)
    }
  })

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center">
        <h2 className="text-base font-semibold">{strings.emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{strings.emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() ? (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={columns.length}>
                      <div className="space-y-3 py-2">
                        {row.original.entries.map((entry) => (
                          <div key={entry.directoryEntryId} className="rounded-lg border border-border/60 bg-background/70 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {deviceNameMap.get(entry.deviceId) ?? entry.deviceId}
                              </Badge>
                              <Badge variant="outline" className="font-mono">
                                {entry.terminalPersonId}
                              </Badge>
                              {!entry.isPresentInLastSync ? (
                                <Badge variant="outline" className="border-slate-400/40 bg-slate-500/10 text-slate-700">
                                  {strings.stale}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                              <div>{strings.linkedPerson}: {entry.linkedPersonName ?? '-'}</div>
                              <div>{strings.lastSeen}: {formatDate(entry.lastSeenAt)}</div>
                              <div>{strings.card}: {entry.cardNo ?? entry.cardName ?? '-'}</div>
                              <div>{strings.validity}: {entry.validFrom ?? '-'} / {entry.validTo ?? '-'}</div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {strings.source}: {entry.sourceSummary.join(', ') || entry.stateReason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
