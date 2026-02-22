import { DeviceSettingsNodeRenderer } from './device-settings-fields.renderer'
import type { DeviceSettingsSchemaView } from './device-settings-schema'
import { TooltipProvider } from '@/components/ui/tooltip'

type DeviceSettingsFieldsProps = {
  schemaView: DeviceSettingsSchemaView
  settingsDraft: Record<string, unknown>
  settingsErrors: Record<string, string>
  isSubmitting: boolean
  onChangeDraft: (next: Record<string, unknown>) => void
}

export function DeviceSettingsFields({
  schemaView,
  settingsDraft,
  settingsErrors,
  isSubmitting,
  onChangeDraft
}: DeviceSettingsFieldsProps) {
  return (
    <TooltipProvider>
      <div className="space-y-3">
        {schemaView.root.properties.map((node) => (
          <DeviceSettingsNodeRenderer
            key={node.key}
            node={node}
            path={[node.key]}
            value={settingsDraft[node.key]}
            rootDraft={settingsDraft}
            errors={settingsErrors}
            isSubmitting={isSubmitting}
            onChangeDraft={onChangeDraft}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}
