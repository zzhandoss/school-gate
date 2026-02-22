# Agent <-> Relay WebSocket Protocol (Draft)

This protocol connects on-prem Agent (inside school network) to the Cloud Relay.
It enables a public Admin Mini App to control and observe the local Core without inbound ports.

## Transport

- WebSocket over TLS (wss)
- JSON messages
- Outbound connection from Agent to Relay

## Envelope

All messages use the same envelope.

```json
{
  "id": "msg-uuid",
  "type": "request | response | event | error",
  "name": "string",
  "replyTo": "msg-uuid (for responses)",
  "tenantId": "school-tenant-id",
  "agentId": "agent-id",
  "ts": 1769436000000,
  "payload": {}
}
```

Notes:
- `request` can be sent by either side.
- `response` must include `replyTo`.
- `event` is push-only.
- `error` is used for protocol-level failures.

## Authentication

Agent sends an `auth` request immediately after connection:

```json
{
  "id": "msg-1",
  "type": "request",
  "name": "auth",
  "tenantId": "t1",
  "agentId": "agent-1",
  "ts": 1769436000000,
  "payload": {
    "token": "agent-token",
    "version": "1.0.0",
    "capabilities": ["core.read", "core.write"]
  }
}
```

Relay responds:

```json
{
  "id": "msg-2",
  "type": "response",
  "name": "auth",
  "replyTo": "msg-1",
  "tenantId": "t1",
  "agentId": "agent-1",
  "ts": 1769436000100,
  "payload": {
    "ok": true
  }
}
```

## Heartbeat

Agent sends `event` every 15-30s:

```json
{
  "id": "hb-1",
  "type": "event",
  "name": "heartbeat",
  "tenantId": "t1",
  "agentId": "agent-1",
  "ts": 1769436001000,
  "payload": {
    "uptimeSec": 12345
  }
}
```

## Commands (Relay -> Agent)

### Subscription Requests

- `list.subscriptionRequests`  
  Payload: `{ status?: "pending" | "approved" | "rejected", limit?: number, cursor?: string }`

- `review.subscriptionRequest`  
  Payload: `{ requestId: string, decision: "approve" | "reject", reason?: string }`

### Unmatched Events

- `list.unmatchedAccessEvents`  
  Payload: `{ limit?: number, cursor?: string }`

- `map.terminalIdentity`  
  Payload: `{ deviceId: string, terminalPersonId: string, personId: string }`

### Devices

- `list.devices`  
  Payload: `{ enabled?: boolean }`

- `upsert.device`  
  Payload: `{ id: string, direction: "IN" | "OUT", adapterKey: string, settingsJson?: string | null, enabled: boolean }`

- `set.deviceEnabled`  
  Payload: `{ id: string, enabled: boolean }`

### Settings

- `get.systemSettings`  
  Payload: `{}`

- `update.systemSettings`  
  Payload: `{ retentionDays?: number, autoResolvePerson?: boolean }`

## Responses

Every request gets a response:

```json
{
  "id": "msg-3",
  "type": "response",
  "name": "list.subscriptionRequests",
  "replyTo": "msg-2",
  "tenantId": "t1",
  "agentId": "agent-1",
  "ts": 1769436002000,
  "payload": {
    "ok": true,
    "data": { "items": [], "nextCursor": null }
  }
}
```

Errors:

```json
{
  "id": "msg-4",
  "type": "response",
  "name": "review.subscriptionRequest",
  "replyTo": "msg-3",
  "tenantId": "t1",
  "agentId": "agent-1",
  "ts": 1769436003000,
  "payload": {
    "ok": false,
    "error": { "code": "NOT_FOUND", "message": "request not found" }
  }
}
```

## Events (Agent -> Relay)

Minimal events for MVP:

- `event.sync.summary`  
  Payload: `{ pendingRequests: number, unmatchedEvents: number, lastEventAt?: number }`

- `event.subscriptionRequest.created`  
  Payload: `{ requestId: string, iin: string, createdAt: number }`

- `event.subscriptionRequest.reviewed`  
  Payload: `{ requestId: string, decision: "approve" | "reject", at: number }`

## Open Questions

- Message size limits and compression.
- Event delivery guarantees (at-least-once vs best-effort).
- Which commands should be allowed when Agent is offline (queueing).
