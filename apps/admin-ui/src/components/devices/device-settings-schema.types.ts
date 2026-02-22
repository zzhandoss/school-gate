export type DeviceSettingsPrimitiveType = "string" | "number" | "integer" | "boolean";

export type DeviceSettingsBaseNode = {
    key: string
    label: string
    description: string | null
    required: boolean
};

export type DeviceSettingsObjectNode = DeviceSettingsBaseNode & {
    kind: "object"
    properties: DeviceSettingsSchemaNode[]
};

export type DeviceSettingsConstStringNode = DeviceSettingsBaseNode & {
    kind: "constString"
    constValue: string
};

export type DeviceSettingsPrimitiveNode = DeviceSettingsBaseNode & {
    kind: "primitive"
    valueType: DeviceSettingsPrimitiveType
    defaultValue?: unknown
};

export type DeviceSettingsEnumStringNode = DeviceSettingsBaseNode & {
    kind: "enumString"
    options: string[]
    defaultValue?: string
};

export type DeviceSettingsArrayStringNode = DeviceSettingsBaseNode & {
    kind: "arrayString"
    minItems: number
    itemOptions: string[] | null
};

export type DeviceSettingsMapStringNode = DeviceSettingsBaseNode & {
    kind: "mapString"
    keyOptions: string[] | null
};

export type DeviceSettingsMapObjectNode = DeviceSettingsBaseNode & {
    kind: "mapObject"
    valueSchema: DeviceSettingsObjectNode
};

export type DeviceSettingsSchemaNode =
  | DeviceSettingsObjectNode
  | DeviceSettingsConstStringNode
  | DeviceSettingsPrimitiveNode
  | DeviceSettingsEnumStringNode
  | DeviceSettingsArrayStringNode
  | DeviceSettingsMapStringNode
  | DeviceSettingsMapObjectNode;

export type DeviceSettingsSchemaView = {
    root: DeviceSettingsObjectNode
};
