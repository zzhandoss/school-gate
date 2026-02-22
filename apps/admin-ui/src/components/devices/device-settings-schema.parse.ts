import type {
  DeviceSettingsBaseNode,
  DeviceSettingsMapObjectNode,
  DeviceSettingsMapStringNode,
  DeviceSettingsSchemaNode,
  DeviceSettingsSchemaView
} from './device-settings-schema.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toLabelFromKey(key: string) {
  return key
    .split(/[_\-.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toNodeMeta(key: string, schema: Record<string, unknown>, required: Set<string>): DeviceSettingsBaseNode {
  const title = typeof schema.title === 'string' && schema.title.trim() ? schema.title : toLabelFromKey(key)
  const description =
    typeof schema.description === 'string' && schema.description.trim().length > 0 ? schema.description : null

  return {
    key,
    label: title,
    description,
    required: required.has(key)
  }
}

function getRequiredSet(schema: Record<string, unknown>) {
  if (!Array.isArray(schema.required)) return new Set<string>()
  return new Set(schema.required.filter((item): item is string => typeof item === 'string'))
}

function parseObjectProperties(schema: Record<string, unknown>, required: Set<string>) {
  const properties = schema.properties
  if (!isRecord(properties)) return []

  const nodes: DeviceSettingsSchemaNode[] = []
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!isRecord(propertySchema)) continue
    const node = parseSchemaNode(key, propertySchema, required)
    if (node) nodes.push(node)
  }
  return nodes
}

function parseMapStringNode(
  key: string,
  schema: Record<string, unknown>,
  required: Set<string>
): DeviceSettingsMapStringNode | null {
  const additional = schema.additionalProperties
  if (!isRecord(additional) || additional.type !== 'string') return null
  const propertyNames = schema.propertyNames
  const keyOptions =
    isRecord(propertyNames) && Array.isArray(propertyNames.enum)
      ? propertyNames.enum.filter((item): item is string => typeof item === 'string')
      : null

  return {
    ...toNodeMeta(key, schema, required),
    kind: 'mapString',
    keyOptions: keyOptions && keyOptions.length > 0 ? keyOptions : null
  }
}

function parseMapObjectNode(
  key: string,
  schema: Record<string, unknown>,
  required: Set<string>
): DeviceSettingsMapObjectNode | null {
  const additional = schema.additionalProperties
  if (!isRecord(additional) || additional.type !== 'object') return null

  const additionalRequired = getRequiredSet(additional)
  const properties = parseObjectProperties(additional, additionalRequired)
  if (properties.length === 0) return null

  return {
    ...toNodeMeta(key, schema, required),
    kind: 'mapObject',
    valueSchema: {
      ...toNodeMeta('__value__', additional, new Set()),
      kind: 'object',
      properties
    }
  }
}

function parseSchemaNode(
  key: string,
  schema: Record<string, unknown>,
  required: Set<string>
): DeviceSettingsSchemaNode | null {
  const baseMeta = toNodeMeta(key, schema, required)

  if (typeof schema.const === 'string') {
    return { ...baseMeta, kind: 'constString', constValue: schema.const }
  }

  if (Array.isArray(schema.enum)) {
    const options = schema.enum.filter((item): item is string => typeof item === 'string')
    if (options.length > 0) {
      return {
        ...baseMeta,
        kind: 'enumString',
        options,
        defaultValue: typeof schema.default === 'string' ? schema.default : undefined
      }
    }
  }

  if (schema.type === 'object' || schema.properties !== undefined || schema.additionalProperties !== undefined) {
    const mapObjectNode = parseMapObjectNode(key, schema, required)
    if (mapObjectNode) return mapObjectNode

    const mapStringNode = parseMapStringNode(key, schema, required)
    if (mapStringNode) return mapStringNode

    const nestedRequired = getRequiredSet(schema)
    const properties = parseObjectProperties(schema, nestedRequired)
    if (properties.length === 0) return null
    return { ...baseMeta, kind: 'object', properties }
  }

  if (schema.type === 'array' && isRecord(schema.items) && schema.items.type === 'string') {
    const itemOptions = Array.isArray(schema.items.enum)
      ? schema.items.enum.filter((item): item is string => typeof item === 'string')
      : []
    return {
      ...baseMeta,
      kind: 'arrayString',
      minItems: typeof schema.minItems === 'number' ? schema.minItems : 0,
      itemOptions: itemOptions.length > 0 ? itemOptions : null
    }
  }

  if (schema.type === 'string' || schema.type === 'number' || schema.type === 'integer' || schema.type === 'boolean') {
    return { ...baseMeta, kind: 'primitive', valueType: schema.type, defaultValue: schema.default }
  }

  return null
}

function createInitialValue(node: DeviceSettingsSchemaNode): unknown {
  if (node.kind === 'object') {
    const record: Record<string, unknown> = {}
    for (const property of node.properties) {
      const initial = createInitialValue(property)
      if (initial !== undefined) record[property.key] = initial
    }
    return record
  }
  if (node.kind === 'mapObject' || node.kind === 'mapString') return {}
  if (node.kind === 'arrayString') return []
  if (node.kind === 'constString') return node.constValue
  if (node.kind === 'enumString') return node.defaultValue ?? ''
  if (node.valueType === 'boolean') return typeof node.defaultValue === 'boolean' ? node.defaultValue : false
  if (typeof node.defaultValue === 'string' || typeof node.defaultValue === 'number') return node.defaultValue
  return ''
}

function mergeWithSchemaDefaults(node: DeviceSettingsSchemaNode, current: unknown): unknown {
  if (node.kind === 'object') {
    const currentRecord = isRecord(current) ? current : {}
    const result: Record<string, unknown> = {}
    for (const property of node.properties) {
      result[property.key] = mergeWithSchemaDefaults(property, currentRecord[property.key])
    }
    return result
  }
  if (node.kind === 'mapObject') {
    if (!isRecord(current)) return {}
    const result: Record<string, unknown> = {}
    for (const [mapKey, mapValue] of Object.entries(current)) {
      result[mapKey] = mergeWithSchemaDefaults(node.valueSchema, mapValue)
    }
    return result
  }
  if (node.kind === 'mapString') return isRecord(current) ? current : {}
  if (node.kind === 'arrayString') return Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string') : []
  if (node.kind === 'constString') return node.constValue
  if (node.kind === 'enumString') {
    const value = typeof current === 'string' ? current : ''
    if (node.options.includes(value)) return value
    return node.defaultValue ?? ''
  }
  if (node.valueType === 'boolean') return typeof current === 'boolean' ? current : Boolean(createInitialValue(node))
  if (node.valueType === 'number' || node.valueType === 'integer') {
    if (typeof current === 'number' || typeof current === 'string') return current
    const initial = createInitialValue(node)
    return typeof initial === 'number' ? String(initial) : initial
  }
  if (typeof current === 'string') return current
  const initial = createInitialValue(node)
  return typeof initial === 'string' ? initial : ''
}

export function parseDeviceSettingsSchema(schema: unknown): DeviceSettingsSchemaView | null {
  if (!isRecord(schema)) return null
  const properties = parseObjectProperties(schema, getRequiredSet(schema))
  if (properties.length === 0) return null
  return {
    root: {
      key: '__root__',
      label: 'Device settings',
      description: typeof schema.description === 'string' ? schema.description : null,
      required: true,
      kind: 'object',
      properties
    }
  }
}

export function parseSettingsJsonObject(settingsJson: string | null | undefined) {
  if (!settingsJson || !settingsJson.trim()) return null
  try {
    const parsed = JSON.parse(settingsJson)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function createFieldDraft(
  schema: DeviceSettingsSchemaView,
  currentSettings: Record<string, unknown> | null
): Record<string, unknown> {
  return mergeWithSchemaDefaults(schema.root, currentSettings ?? {}) as Record<string, unknown>
}
