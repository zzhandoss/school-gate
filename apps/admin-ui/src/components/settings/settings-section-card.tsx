import type { GroupDef, GroupDraft, GroupSnapshot, SectionState } from './settings-utils'
import type { RuntimeField } from '@/lib/settings/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type SettingsSectionCardProps = {
  group: GroupDef
  groupSnapshot: GroupSnapshot
  draft: GroupDraft
  changed: boolean
  canWrite: boolean
  sectionState: SectionState
  onDraftChange: (fieldKey: string, value: string | boolean) => void
  onReset: () => void
  onSave: () => Promise<void>
}

function renderFieldMeta(field: RuntimeField<unknown>) {
  const dbValue = field.db === undefined ? 'not overridden' : String(field.db)
  const updatedAt = field.updatedAt ?? 'never'

  return (
    <p className="mt-1 text-[11px] text-muted-foreground">
      effective: <span className="font-medium text-foreground">{String(field.effective)}</span>
      {' · '}db: <span className="font-medium text-foreground">{dbValue}</span>
      {' · '}env: <span className="font-medium text-foreground">{String(field.env)}</span>
      {' · '}updated: <span className="font-medium text-foreground">{updatedAt}</span>
    </p>
  )
}

export function SettingsSectionCard(props: SettingsSectionCardProps) {
  const {
    group,
    groupSnapshot,
    draft,
    changed,
    canWrite,
    sectionState,
    onDraftChange,
    onReset,
    onSave
  } = props

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <Badge variant={changed ? 'default' : 'outline'}>{changed ? 'Changed' : 'Clean'}</Badge>
          {!canWrite ? <Badge variant="outline">Read-only</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{group.description}</p>
      </div>
      <div className="space-y-4">
        {group.fields.map((field) => {
          const value = draft[field.key]
          const source = groupSnapshot[field.key]
          return (
            <div key={field.key} className="rounded-lg border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${group.key}-${field.key}`}>{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
              {field.kind === 'boolean' ? (
                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    id={`${group.key}-${field.key}`}
                    checked={value === true}
                    disabled={!canWrite}
                    onCheckedChange={(next) => onDraftChange(field.key, next)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {value === true ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : (
                <Input
                  id={`${group.key}-${field.key}`}
                  type={field.kind === 'number' ? 'number' : 'text'}
                  min={field.kind === 'number' ? 1 : undefined}
                  value={String(value)}
                  disabled={!canWrite}
                  onChange={(event) => onDraftChange(field.key, event.target.value)}
                  className="mt-2"
                />
              )}
              {renderFieldMeta(source)}
            </div>
          )
        })}

        {sectionState.error ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>{sectionState.error}</AlertDescription>
          </Alert>
        ) : null}
        {sectionState.success ? (
          <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>{sectionState.success}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={!changed || sectionState.saving} onClick={onReset}>
            Reset section
          </Button>
          <Button type="button" disabled={!canWrite || !changed || sectionState.saving} onClick={() => void onSave()}>
            {sectionState.saving ? 'Saving...' : 'Save section'}
          </Button>
        </div>
      </div>
    </section>
  )
}

