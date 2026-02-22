import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDevice, getMonitoringSnapshot, listAdapters, listDevices, removeDevice, setDeviceEnabled, updateDevice } from './service'

describe('devices service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads devices list from /api/ds/devices', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            devices: []
          }
        })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await listDevices()

    expect(result).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/ds/devices')
  })

  it('loads adapters list from /api/ds/adapters', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            adapters: [
              {
                adapterId: 'mock-1',
                vendorKey: 'mock',
                instanceKey: 'lab-a',
                instanceName: 'Lab A',
                baseUrl: 'http://localhost:4100',
                retentionMs: 3_600_000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                  type: 'object',
                  properties: {
                    host: { type: 'string' }
                  },
                  required: ['host']
                },
                mode: 'active',
                registeredAt: '2026-02-10T12:00:00.000Z',
                lastSeenAt: '2026-02-10T12:01:00.000Z'
              }
            ]
          }
        })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await listAdapters()

    expect(result).toHaveLength(1)
    expect(result[0]?.instanceName).toBe('Lab A')
    expect(result[0]?.deviceSettingsSchema).toEqual({
      type: 'object',
      properties: {
        host: { type: 'string' }
      },
      required: ['host']
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/ds/adapters')
  })

  it('creates, updates, toggles and deletes devices using DS endpoints', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ success: true, data: { ok: true } })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    await createDevice({
      deviceId: 'dev-1',
      name: 'Main gate',
      direction: 'IN',
      adapterKey: 'mock',
      enabled: true
    })
    await updateDevice('dev-1', { name: 'Main gate updated' })
    await setDeviceEnabled('dev-1', false)
    await removeDevice('dev-1')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/api/ds/devices',
      expect.objectContaining({ method: 'PUT' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/ds/devices/dev-1',
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/api/ds/devices/dev-1/enabled',
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://localhost:3000/api/ds/devices/dev-1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('loads monitoring from /api/ds/monitoring', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            adapters: [],
            devices: [],
            outbox: { counts: {}, oldestNewCreatedAt: null }
          }
        })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMonitoringSnapshot()

    expect(result.adapters).toEqual([])
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/ds/monitoring')
  })
})

