import { afterEach, describe, expect, it, vi } from 'vitest'

import { listSubscriptionRequests } from './service'

describe('subscription requests service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads queue with status/order/pagination query', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              requests: [],
              page: { limit: 20, offset: 40, total: 100 }
            }
          })
      } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await listSubscriptionRequests({
      limit: 20,
      offset: 40,
      status: 'not_pending',
      only: 'all',
      order: 'newest'
    })

    expect(result.page).toEqual({ limit: 20, offset: 40, total: 100 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/api/subscription-requests?limit=20&offset=40&status=not_pending&only=all&order=newest'
    )
  })
})
