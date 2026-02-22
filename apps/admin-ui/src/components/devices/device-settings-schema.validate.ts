import type { DeviceSettingsSchemaNode, DeviceSettingsSchemaView } from './device-settings-schema.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toPath(path: string[]) {
  return path.join('.')
}

function validateNode(node: DeviceSettingsSchemaNode, value: unknown, path: string[], errors: Record<string, string>): unknown {
  if (node.kind === 'object') {
    const source = isRecord(value) ? value : {}
    const result: Record<string, unknown> = {}
    for (const property of node.properties) {
      const next = validateNode(property, source[property.key], [...path, property.key], errors)
      if (next !== undefined) result[property.key] = next
    }
    return Object.keys(result).length > 0 ? result : undefined
  }

  if (node.kind === 'mapObject') {
    const source = isRecord(value) ? value : {}
    const result: Record<string, unknown> = {}
    for (const [mapKey, mapValue] of Object.entries(source)) {
      const cleanedKey = mapKey.trim()
      if (!cleanedKey) {
        errors[toPath([...path, mapKey || '(empty)'])] = 'Key is required.'
        continue
      }
      const next = validateNode(node.valueSchema, mapValue, [...path, cleanedKey], errors)
      if (next !== undefined) result[cleanedKey] = next
    }
    if (node.required && Object.keys(result).length === 0) {
      errors[toPath(path)] = 'At least one mapping is required.'
    }
    return Object.keys(result).length > 0 ? result : undefined
  }

  if (node.kind === 'mapString') {
    const source = isRecord(value) ? value : {}
    const result: Record<string, string> = {}
    for (const [mapKey, mapValue] of Object.entries(source)) {
      const cleanedKey = mapKey.trim()
      if (!cleanedKey) {
        errors[toPath([...path, mapKey || '(empty)'])] = 'Key is required.'
        continue
      }
      if (node.keyOptions && !node.keyOptions.includes(cleanedKey)) {
        errors[toPath([...path, cleanedKey])] = 'Key is not allowed.'
        continue
      }
      if (typeof mapValue !== 'string' || mapValue.trim().length === 0) {
        if (node.key === 'paramsTemplate') {
          result[cleanedKey] = '{{identityValue}}'
          continue
        }
        errors[toPath([...path, cleanedKey])] = 'Value is required.'
        continue
      }
      result[cleanedKey] = mapValue
    }
    if (node.required && Object.keys(result).length === 0) {
      errors[toPath(path)] = 'At least one entry is required.'
    }
    return Object.keys(result).length > 0 ? result : undefined
  }

  if (node.kind === 'arrayString') {
    const source = Array.isArray(value) ? value : []
    const result = source.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    if (node.itemOptions) {
      const invalid = result.find((item) => !node.itemOptions?.includes(item))
      if (invalid) {
        errors[toPath(path)] = `Value "${invalid}" is not in allowed enum options.`
        return undefined
      }
    }
    if (result.length > 0 && result.length < node.minItems) {
      errors[toPath(path)] = `At least ${node.minItems} item(s) required.`
    }
    if (node.required && result.length === 0) errors[toPath(path)] = 'At least one item is required.'
    return result.length > 0 ? result : undefined
  }

  if (node.kind === 'constString') return node.constValue

  if (node.kind === 'enumString') {
    const current = typeof value === 'string' ? value.trim() : ''
    if (!current) {
      if (node.required) errors[toPath(path)] = 'This field is required.'
      return undefined
    }
    if (!node.options.includes(current)) {
      errors[toPath(path)] = 'Value is not in allowed enum options.'
      return undefined
    }
    return current
  }

  if (node.valueType === 'boolean') {
    if (typeof value === 'boolean') return value
    if (node.required) errors[toPath(path)] = 'This field is required.'
    return undefined
  }

  const raw = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
  if (!raw) {
    if (node.required) errors[toPath(path)] = 'This field is required.'
    return undefined
  }
  if (node.valueType === 'string') return raw

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    errors[toPath(path)] = 'Value must be numeric.'
    return undefined
  }
  if (node.valueType === 'integer' && !Number.isInteger(parsed)) {
    errors[toPath(path)] = 'Value must be an integer.'
    return undefined
  }
  return parsed
}

export function buildSettingsJsonFromDraft(
  schema: DeviceSettingsSchemaView,
  draft: Record<string, unknown>
): { settingsJson: string | null; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {}
  const normalized = validateNode(schema.root, draft, [], fieldErrors)
  if (Object.keys(fieldErrors).length > 0) return { settingsJson: null, fieldErrors }
  if (!isRecord(normalized) || Object.keys(normalized).length === 0) return { settingsJson: null, fieldErrors: {} }
  return { settingsJson: JSON.stringify(normalized), fieldErrors: {} }
}
