import { useEffect, useState } from 'react'
import { CircleHelp, Plus, Trash2 } from 'lucide-react'

import type {
  DeviceSettingsArrayStringNode,
  DeviceSettingsMapObjectNode,
  DeviceSettingsMapStringNode,
  DeviceSettingsSchemaNode
} from './device-settings-schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toPath(path: string[]) {
  return path.join('.')
}

function cloneDraft(current: Record<string, unknown>) {
  return structuredClone(current)
}

function getContainer(draft: Record<string, unknown>, path: string[]) {
  let cursor: Record<string, unknown> = draft
  for (const segment of path) {
    const next = cursor[segment]
    if (!isRecord(next)) cursor[segment] = {}
    cursor = cursor[segment] as Record<string, unknown>
  }
  return cursor
}

function SectionLabel({ node }: { node: DeviceSettingsSchemaNode }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm">{node.label}</Label>
      {node.description ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label={`Hint for ${node.label}`}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">{node.description}</TooltipContent>
        </Tooltip>
      ) : null}
      {node.required ? <span className="text-xs font-medium text-destructive">required</span> : <span className="text-xs text-muted-foreground">optional</span>}
    </div>
  )
}

function renderArray(node: DeviceSettingsArrayStringNode, value: unknown, update: (next: unknown) => void, disabled: boolean) {
  const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  const availableOptions = node.itemOptions ?? []
  const hasOptions = availableOptions.length > 0
  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-3">
      {items.length === 0 ? <p className="text-xs text-muted-foreground">No items yet.</p> : null}
      {items.map((item, index) => (
        <div key={`${node.key}-${index}`} className="flex items-center gap-2">
          {hasOptions ? (
            <Select value={item} disabled={disabled} onValueChange={(selected) => {
              const next = [...items]
              next[index] = selected
              update(next)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={item} disabled={disabled} onChange={(event) => {
              const next = [...items]
              next[index] = event.target.value
              update(next)
            }} placeholder="Value" />
          )}
          <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => update(items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove item">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled || (hasOptions && availableOptions.length === 0)} onClick={() => update([...items, hasOptions ? availableOptions[0] : ''])}>
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </div>
  )
}

function renderMapString(node: DeviceSettingsMapStringNode, value: unknown, update: (next: unknown) => void, disabled: boolean) {
  const map = isRecord(value) ? value : {}
  const entries = Object.entries(map).filter(([, entryValue]) => typeof entryValue === 'string') as Array<[string, string]>
  const usedKeys = new Set(entries.map(([mapKey]) => mapKey))
  const nextKey = node.keyOptions?.find((option) => !usedKeys.has(option)) ?? ''

  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-3">
      {entries.length === 0 ? <p className="text-xs text-muted-foreground">No template fields yet.</p> : null}
      {entries.map(([mapKey, mapValue]) => (
        <div key={mapKey} className="grid gap-2 sm:grid-cols-[200px_1fr_auto] sm:items-center">
          {node.keyOptions ? (
            <Select value={mapKey} disabled={disabled} onValueChange={(nextKeyValue) => {
              const next: Record<string, unknown> = { ...map }
              delete next[mapKey]
              next[nextKeyValue] = mapValue
              update(next)
            }}>
              <SelectTrigger><SelectValue placeholder="Field key" /></SelectTrigger>
              <SelectContent>{node.keyOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input value={mapKey} disabled />
          )}
          <Input value={mapValue} disabled={disabled} onChange={(event) => update({ ...map, [mapKey]: event.target.value })} placeholder='{{identityValue}}' />
          <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => {
            const next: Record<string, unknown> = { ...map }
            delete next[mapKey]
            update(next)
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || (node.keyOptions ? !nextKey : false)}
        onClick={() => {
          const defaultValue = node.key === 'paramsTemplate' ? '{{identityValue}}' : ''
          update({ ...map, [(node.keyOptions ? nextKey : `key${entries.length + 1}`) || '']: defaultValue })
        }}
      >
        <Plus className="h-4 w-4" />
        Add template field
      </Button>
    </div>
  )
}

function renderMapObject(node: DeviceSettingsMapObjectNode, value: unknown, path: string[], isSubmitting: boolean, rootDraft: Record<string, unknown>, onChangeDraft: (next: Record<string, unknown>) => void, errors: Record<string, string>) {
  const map = isRecord(value) ? value : {}
  const entries = Object.entries(map)
  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-3">
      <SectionLabel node={node} />
      {entries.map(([entryKey, entryValue]) => (
        <Card key={entryKey} className="border-border/70">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center mt-auto gap-2">
                <Label className="text-sm">Property name</Label>
                <span className="text-xs font-medium text-destructive">required</span>
              </div>
              <Button type="button" variant="outline" size="icon" disabled={isSubmitting} onClick={() => {
                const next = cloneDraft(rootDraft)
                const container = getContainer(next, path)
                delete container[entryKey]
                onChangeDraft(next)
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <MappingNameInput
              entryKey={entryKey}
              isSubmitting={isSubmitting}
              rootDraft={rootDraft}
              path={path}
              onChangeDraft={onChangeDraft}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <DeviceSettingsNodeRenderer
              node={node.valueSchema}
              path={[...path, entryKey]}
              value={entryValue}
              rootDraft={rootDraft}
              errors={errors}
              isSubmitting={isSubmitting}
              onChangeDraft={onChangeDraft}
            />
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => {
        const next = cloneDraft(rootDraft)
        const container = getContainer(next, path)
        let index = entries.length + 1
        let candidate = `mapping${index}`
        while (container[candidate] !== undefined) {
          index += 1
          candidate = `mapping${index}`
        }
        container[candidate] = {}
        onChangeDraft(next)
      }}>
        <Plus className="h-4 w-4" />
        Add mapping
      </Button>
    </div>
  )
}

function MappingNameInput({
  entryKey,
  isSubmitting,
  rootDraft,
  path,
  onChangeDraft
}: {
  entryKey: string
  isSubmitting: boolean
  rootDraft: Record<string, unknown>
  path: string[]
  onChangeDraft: (next: Record<string, unknown>) => void
}) {
  const [draftName, setDraftName] = useState(entryKey)

  useEffect(() => {
    setDraftName(entryKey)
  }, [entryKey])

  function commitRename() {
    if (draftName === entryKey) return
    const next = cloneDraft(rootDraft)
    const container = getContainer(next, path)
    const valueSnapshot = container[entryKey]
    delete container[entryKey]
    container[draftName] = valueSnapshot
    onChangeDraft(next)
  }

  return (
    <Input
      value={draftName}
      disabled={isSubmitting}
      className="h-8"
      placeholder="iin"
      onChange={(event) => setDraftName(event.target.value)}
      onBlur={commitRename}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commitRename()
          ;(event.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}

export function DeviceSettingsNodeRenderer({
  node,
  path,
  value,
  rootDraft,
  errors,
  isSubmitting,
  onChangeDraft
}: {
  node: DeviceSettingsSchemaNode
  path: string[]
  value: unknown
  rootDraft: Record<string, unknown>
  errors: Record<string, string>
  isSubmitting: boolean
  onChangeDraft: (next: Record<string, unknown>) => void
}) {
  const updateAtPath = (nextValue: unknown) => {
    const nextDraft = cloneDraft(rootDraft)
    const container = getContainer(nextDraft, path.slice(0, -1))
    container[path[path.length - 1] ?? ''] = nextValue
    onChangeDraft(nextDraft)
  }

  if (node.kind === 'object') {
    const valueRecord = isRecord(value) ? value : {}
    return (
      <Card className="border-border/70 bg-muted/20">
        <CardHeader className="pb-3"><CardTitle className="text-sm"><SectionLabel node={node} /></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {node.properties.map((child) => (
            <DeviceSettingsNodeRenderer
              key={`${toPath(path)}-${child.key}`}
              node={child}
              path={[...path, child.key]}
              value={valueRecord[child.key]}
              rootDraft={rootDraft}
              errors={errors}
              isSubmitting={isSubmitting}
              onChangeDraft={onChangeDraft}
            />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-2">
      {node.kind === 'mapObject' ? renderMapObject(node, value, path, isSubmitting, rootDraft, onChangeDraft, errors) : <SectionLabel node={node} />}
      {node.kind === 'mapString' ? renderMapString(node, value, updateAtPath, isSubmitting) : null}
      {node.kind === 'arrayString' ? renderArray(node, value, updateAtPath, isSubmitting) : null}
      {node.kind === 'constString' ? <Input value={node.constValue} disabled /> : null}
      {node.kind === 'enumString' ? (
        <Select value={typeof value === 'string' ? value : ''} onValueChange={updateAtPath as (value: string) => void} disabled={isSubmitting}>
          <SelectTrigger><SelectValue placeholder="Select value" /></SelectTrigger>
          <SelectContent>{node.options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
        </Select>
      ) : null}
      {node.kind === 'primitive' && node.valueType === 'boolean' ? (
        <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/70 px-3 py-2">
          <span className="text-sm text-muted-foreground">Toggle value</span>
          <Switch checked={Boolean(value)} disabled={isSubmitting} onCheckedChange={updateAtPath as (value: boolean) => void} />
        </div>
      ) : null}
      {node.kind === 'primitive' && node.valueType !== 'boolean' ? (
        <Input
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          disabled={isSubmitting}
          inputMode={node.valueType === 'string' ? undefined : 'decimal'}
          onChange={(event) => updateAtPath(event.target.value)}
          placeholder={node.required ? 'Required value' : 'Optional value'}
        />
      ) : null}
      {errors[toPath(path)] ? <p className="text-xs text-destructive">{errors[toPath(path)]}</p> : null}
    </div>
  )
}
