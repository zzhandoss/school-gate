import type {
  ListSubscriptionRequestsInput,
  ListSubscriptionRequestsResult,
  ResolveSubscriptionRequestPersonInput,
  ResolveSubscriptionRequestPersonResult,
  ReviewSubscriptionRequestInput,
  ReviewSubscriptionRequestResult,
} from './types'
import { requestApi } from '@/lib/api/client'

export async function listSubscriptionRequests(input: ListSubscriptionRequestsInput = {}) {
  const query = new URLSearchParams()
  query.set('limit', String(input.limit ?? 50))
  query.set('offset', String(input.offset ?? 0))
  query.set('status', input.status ?? 'pending')
  query.set('only', input.only ?? 'all')
  query.set('order', input.order ?? 'newest')

  const response = await requestApi<ListSubscriptionRequestsResult>(
    `/api/subscription-requests?${query.toString()}`
  )
  return response
}

export async function reviewSubscriptionRequest(
  requestId: string,
  input: ReviewSubscriptionRequestInput
) {
  return requestApi<ReviewSubscriptionRequestResult>(`/api/subscription-requests/${requestId}/review`, {
    method: 'POST',
    body: input
  })
}

export async function resolveSubscriptionRequestPerson(
  requestId: string,
  input: ResolveSubscriptionRequestPersonInput
) {
  return requestApi<ResolveSubscriptionRequestPersonResult>(
    `/api/subscription-requests/${requestId}/resolve-person`,
    {
      method: 'POST',
      body: input
    }
  )
}
