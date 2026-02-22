import { ApiError } from './types'

type SuccessEnvelope<T> = {
  success: true
  data: T
}

type FailEnvelope = {
  success: false
  error: {
    code: string
    message: string
    data?: unknown
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseEnvelope<T>(status: number, payload: unknown) {
  if (!isObject(payload) || typeof payload.success !== 'boolean') {
    throw new ApiError(status, {
      code: 'invalid_response',
      message: 'API response has invalid shape'
    })
  }

  if (payload.success) {
    return (payload as SuccessEnvelope<T>).data
  }

  const fail = payload as FailEnvelope
  throw new ApiError(status, {
    code: fail.error.code,
    message: fail.error.message,
    data: fail.error.data
  })
}
