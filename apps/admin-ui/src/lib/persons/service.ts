import type {
  ApplyAutoIdentitiesInput,
  ApplyAutoIdentitiesResult,
  AutoIdentityPreviewByIinResult,
  AutoIdentityPreviewResult,
  CreatePersonInput,
  DeviceIdentityFindResult,
  ListPersonsInput,
  ListPersonsResult,
  PersonIdentityItem,
  PersonItem,
  UpdatePersonInput,
  UpsertPersonIdentityInput
} from './types'
import { requestApi } from '@/lib/api/client'

type ListPersonsResponse = {
  persons: Array<PersonItem>
  page: {
    limit: number
    offset: number
    total: number
  }
}

type GetPersonResponse = {
  person: PersonItem
}

type ListPersonIdentitiesResponse = {
  identities: Array<PersonIdentityItem>
}

export async function listPersons(input: ListPersonsInput = {}): Promise<ListPersonsResult> {
  const query = new URLSearchParams({
    limit: String(input.limit ?? 50),
    offset: String(input.offset ?? 0)
  })
  if (input.iin?.trim()) {
    query.set('iin', input.iin.trim())
  }
  if (input.query?.trim()) {
    query.set('query', input.query.trim())
  }

  const response = await requestApi<ListPersonsResponse>(`/api/persons?${query.toString()}`)
  return response
}

export async function getPerson(personId: string) {
  const response = await requestApi<GetPersonResponse>(`/api/persons/${personId}`)
  return response.person
}

export async function createPerson(input: CreatePersonInput) {
  const response = await requestApi<GetPersonResponse>('/api/persons', {
    method: 'POST',
    body: input
  })
  return response.person
}

export async function updatePerson(personId: string, patch: UpdatePersonInput) {
  const response = await requestApi<GetPersonResponse>(`/api/persons/${personId}`, {
    method: 'PATCH',
    body: patch
  })
  return response.person
}

export async function listPersonIdentities(personId: string) {
  const response = await requestApi<ListPersonIdentitiesResponse>(`/api/persons/${personId}/identities`)
  return response.identities
}

export async function createPersonIdentity(personId: string, body: UpsertPersonIdentityInput) {
  await requestApi(`/api/persons/${personId}/identities`, {
    method: 'POST',
    body
  })
}

export async function updatePersonIdentity(personId: string, identityId: string, body: UpsertPersonIdentityInput) {
  await requestApi(`/api/persons/${personId}/identities/${identityId}`, {
    method: 'PATCH',
    body
  })
}

export async function deletePersonIdentity(personId: string, identityId: string) {
  await requestApi(`/api/persons/${personId}/identities/${identityId}`, {
    method: 'DELETE'
  })
}

export async function previewAutoIdentities(personId: string) {
  return requestApi<AutoIdentityPreviewResult>(`/api/persons/${personId}/identities/auto/preview`, {
    method: 'POST'
  })
}

export async function previewAutoIdentitiesByIin(iin: string) {
  return requestApi<AutoIdentityPreviewByIinResult>('/api/persons/identities/auto/preview/by-iin', {
    method: 'POST',
    body: { iin }
  })
}

export async function findIdentityInDevice(input: { deviceId: string; identityKey: string; identityValue: string }) {
  return requestApi<DeviceIdentityFindResult>('/api/ds/identity/find', {
    method: 'POST',
    body: {
      identityKey: input.identityKey,
      identityValue: input.identityValue,
      deviceId: input.deviceId,
      limit: 1
    }
  })
}

export async function applyAutoIdentities(personId: string, body: ApplyAutoIdentitiesInput) {
  return requestApi<ApplyAutoIdentitiesResult>(`/api/persons/${personId}/identities/auto/apply`, {
    method: 'POST',
    body
  })
}
