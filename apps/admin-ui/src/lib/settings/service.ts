import type { RuntimeSettingsSnapshot, SetRuntimeSettingsInput } from './types'
import { requestApi } from '@/lib/api/client'

export async function getRuntimeSettingsSnapshot() {
  return requestApi<RuntimeSettingsSnapshot>('/api/runtime-settings')
}

export async function patchRuntimeSettings(input: SetRuntimeSettingsInput) {
  return requestApi<{ updated: number }>('/api/runtime-settings', {
    method: 'PATCH',
    body: input
  })
}
