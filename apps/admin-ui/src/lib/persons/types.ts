export type PersonItem = {
  id: string
  iin: string
  terminalPersonId: string | null
  hasDeviceIdentities?: boolean
  firstName: string | null
  lastName: string | null
  createdAt: string
}

export type PersonIdentityItem = {
  id: string
  personId: string
  deviceId: string
  terminalPersonId: string
  createdAt: string
}

export type ListPersonsInput = {
  limit?: number
  offset?: number
  iin?: string
  query?: string
}

export type ListPersonsResult = {
  persons: Array<PersonItem>
  page: {
    limit: number
    offset: number
    total: number
  }
}

export type CreatePersonInput = {
  iin: string
  firstName?: string | null
  lastName?: string | null
}

export type CreatePersonWithAutoIdentitiesInput = CreatePersonInput & {
  autoIdentities?: Array<{
    deviceId: string
    terminalPersonId: string
  }>
}

export type UpdatePersonInput = {
  iin?: string
  firstName?: string | null
  lastName?: string | null
}

export type UpsertPersonIdentityInput = {
  deviceId: string
  terminalPersonId: string
}

export type AutoIdentityPreviewMatch = {
  deviceId: string
  adapterKey: string
  terminalPersonId: string
  firstName?: string | null
  lastName?: string | null
  score?: number | null
  rawPayload?: string | null
  displayName?: string | null
  source?: string | null
  userType?: string | null
  alreadyLinked: boolean
}

export type DeviceIdentityFindMatch = Omit<AutoIdentityPreviewMatch, 'alreadyLinked'>

export type DeviceIdentityFindResult = {
  identityKey: string
  identityValue: string
  matches: Array<DeviceIdentityFindMatch>
  diagnostics: {
    adaptersScanned: number
    devicesScanned: number
    devicesEligible: number
    requestsSent: number
    errors: number
  }
  errors: Array<{
    adapterKey: string
    deviceId: string
    message: string
  }>
}

export type AutoIdentityPreviewResult = {
  personId: string
  identityKey: string
  identityValue: string
  matches: Array<AutoIdentityPreviewMatch>
  diagnostics: {
    adaptersScanned: number
    devicesScanned: number
    devicesEligible: number
    requestsSent: number
    errors: number
  }
  errors: Array<{
    adapterKey: string
    deviceId: string
    message: string
  }>
}

export type AutoIdentityPreviewByIinResult = {
  iin: string
  identityKey: string
  identityValue: string
  matches: Array<AutoIdentityPreviewMatch>
  diagnostics: {
    adaptersScanned: number
    devicesScanned: number
    devicesEligible: number
    requestsSent: number
    errors: number
  }
  errors: Array<{
    adapterKey: string
    deviceId: string
    message: string
  }>
}

export type ApplyAutoIdentitiesInput = {
  identities: Array<{
    deviceId: string
    terminalPersonId: string
  }>
}

export type ApplyAutoIdentitiesResult = {
  personId: string
  total: number
  linked: number
  alreadyLinked: number
  conflicts: number
  errors: number
  results: Array<{
    deviceId: string
    terminalPersonId: string
    status: 'linked' | 'already_linked' | 'conflict' | 'error'
    message?: string | null
  }>
}
