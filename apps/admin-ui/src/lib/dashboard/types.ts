export type MonitoringSnapshot = {
  now: string
  accessEvents: {
    counts: Record<string, number>
    oldestUnprocessedOccurredAt: string | null
  }
  outbox: {
    counts: Record<string, number>
    oldestNewCreatedAt: string | null
  }
  workers: Array<{
    workerId: string
    status: 'ok' | 'stale'
    updatedAt: string
    lastErrorAt: string | null
    lastError: string | null
  }>
  components: Array<{
    componentId: string
    status: 'ok' | 'down'
    checkedAt: string
    error: string | null
  }>
}

export type PendingRequestItem = {
  id: string
  iin: string
  tgUserId: string
  resolutionStatus: string
  createdAt: string
}
