export type ApiErrorPayload = {
  code: string
  message: string
  data?: unknown
}

export class ApiError extends Error {
  status: number
  code: string
  data?: unknown

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code
    this.data = payload.data
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  skipAuth?: boolean
  retryOnAuthError?: boolean
}
