import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyAutoIdentities,
  findIdentityInDevice,
  listPersons,
  previewAutoIdentities,
  previewAutoIdentitiesByIin
} from './service'

describe('persons service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads persons with pagination query and page metadata', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              persons: [],
              page: { limit: 20, offset: 40, total: 100 }
            }
          })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await listPersons({
      limit: 20,
      offset: 40,
      iin: '0305',
      query: 'ivan'
    })

    expect(result.page).toEqual({ limit: 20, offset: 40, total: 100 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/api/persons?limit=20&offset=40&iin=0305&query=ivan'
    )
  })

  it('calls auto identity preview and apply endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              personId: 'p1',
              identityKey: 'iin',
              identityValue: '900101000001',
              matches: [],
              diagnostics: {
                adaptersScanned: 0,
                devicesScanned: 0,
                devicesEligible: 0,
                requestsSent: 0,
                errors: 0
              },
              errors: []
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              iin: '900101000001',
              identityKey: 'iin',
              identityValue: '900101000001',
              matches: [],
              diagnostics: {
                adaptersScanned: 0,
                devicesScanned: 0,
                devicesEligible: 0,
                requestsSent: 0,
                errors: 0
              },
              errors: []
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              identityKey: 'iin',
              identityValue: '900101000001',
              matches: [],
              diagnostics: {
                adaptersScanned: 0,
                devicesScanned: 0,
                devicesEligible: 0,
                requestsSent: 0,
                errors: 0
              },
              errors: []
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              personId: 'p1',
              total: 1,
              linked: 1,
              alreadyLinked: 0,
              conflicts: 0,
              errors: 0,
              results: [{ deviceId: 'dev-1', terminalPersonId: 'T-1', status: 'linked' }]
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
    vi.stubGlobal('fetch', fetchMock)

    await previewAutoIdentities('p1')
    await previewAutoIdentitiesByIin('900101000001')
    await findIdentityInDevice({
      deviceId: 'dev-1',
      identityKey: 'iin',
      identityValue: '900101000001'
    })
    await applyAutoIdentities('p1', {
      identities: [{ deviceId: 'dev-1', terminalPersonId: 'T-1' }]
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/persons/p1/identities/auto/preview')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:3000/api/persons/identities/auto/preview/by-iin')
    expect(fetchMock.mock.calls[2]?.[0]).toBe('http://localhost:3000/api/ds/identity/find')
    expect(fetchMock.mock.calls[3]?.[0]).toBe('http://localhost:3000/api/persons/p1/identities/auto/apply')
  })
})
