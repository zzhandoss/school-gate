# Device Service Contract (Draft)

This document defines the integration contract between Device Service and Core for access event ingestion.
It is a draft and intentionally keeps key API choices explicit and reviewable.

## Scope

- Device Service normalizes terminal-specific events into a stable core schema.
- Core persists events, dedupes by idempotency key, and handles identity resolution.
- Device Service must support backfill after downtime and retry on transient failures.

Out of scope (future):
- Terminal data sync APIs (persons, photos, device inventory)
- Custom resolve builders or scripts

## Responsibilities

Device Service:
- Owns device configuration (direction, vendor adapter, connection details).
- Produces a stable `eventId` for each terminal event.
- Normalizes terminal payloads into the Core schema.
- Retries delivery until Core acknowledges acceptance.

Core:
- Idempotent ingestion and persistence.
- Identity resolution and person mapping.
- Notification workflow and auditing.

## Event Schema (Core Input)

Field | Type | Required | Notes
--- | --- | --- | ---
eventId | string | yes | Unique per device. Used for idempotency.
deviceId | string | yes | Logical device identifier in Core.
direction | "IN" \| "OUT" | yes | Device Service maps direction before ingestion.
occurredAt | timestamp | yes | See timestamp format below.
terminalPersonId | string \| null | no | Terminal-side person identifier.
iin | string \| null | no | Optional. If present, Core may auto-create person.
rawPayload | string \| null | no | Original payload serialized as JSON string.

### Timestamp format

Decision:
- `occurredAt` is a unix epoch in milliseconds

## Idempotency

- Core dedupes using `idempotencyKey = deviceId + ":" + eventId`.
- If the same event is sent again, Core must respond with `result = "duplicate"` and no side effects.
- Device Service should treat `duplicate` as a successful ack.

## Delivery and Retry Semantics

- Device Service retries on network errors and 5xx responses.
- 4xx responses indicate permanent issues and should not be retried without operator action.
- Backfill: after downtime, Device Service sends a batch from the last acknowledged event.

## Adapter Integration (Realtime + Backfill)

Decision:
- Adapters are separate processes/services per vendor and register with Device Service (DS).
- DS is passive and waits for adapter registrations (adapters auto-reconnect on DS restarts).
- One active adapter per vendor; new adapter takes over and the old one is drained.

### Adapter handshake (register)

Adapter -> DS (register):
- `POST /adapters/register`
- `vendorKey`, `instanceKey?`, `instanceName?`, `version`, `capabilities`, `baseUrl`, `retentionMs`

Identity and restart behavior:
- Adapter identity is `vendorKey + instanceKey` (if omitted, DS treats `instanceKey = vendorKey`).
- Re-registering the same stale identity reuses the same `adapterId`.
- If the same identity is still alive (heartbeat within TTL), DS rejects new register with conflict (`adapter_instance_active`).
- `instanceName` is an optional UI label for distinguishing instances.

DS -> Adapter (assignments):
- `adapterId`, `assignedDevices[]`, `lastAckedEventId` per device
- `batchLimit`, `heartbeatIntervalMs`
- `mode`: `active` or `draining`

### Adapter heartbeat

- `POST /adapters/heartbeat`
- Adapter sends `adapterId`, DS responds with current assignments and mode.

### Realtime push

- `POST /adapters/events`
- Adapter pushes normalized events to DS as they arrive.
- DS persists into its outbox and delivers to Core.
- DS acks only after Core accepts (inserted/duplicate).

### Backfill fetch

- DS calls adapter `fetchEvents(sinceEventId, limit)` per device.
- Adapter returns events strictly after `sinceEventId`.
- DS sends to Core and advances cursor after successful ack.

Adapter endpoint (proposed):
- `POST /events/backfill` with `{ deviceId, sinceEventId, limit }`
- Adapter authenticates DS via `Authorization: Bearer <DEVICE_SERVICE_TOKEN>`

### Draining / update flow

- New adapter registers and becomes `active`.
- DS marks old adapter as `draining` on next heartbeat/push response.
- Old adapter stops polling and may serve backfill for its buffered raw events.

### Retention

- Adapters store raw events temporarily (retention window).
- DS provides `lastAckedEventId` so adapters can GC anything <= ack.

## Suggested HTTP API

Decision:
- `POST /api/events` (single)
- `POST /api/events/batch` (batch)

## Admin HTTP API (DeviceService)

Auth:
- `Authorization: Bearer <ADMIN_JWT>`
- JWT includes `permissions[]` and is verified with `ADMIN_JWT_SECRET`.
- Permissions:
  - `devices.read` for GET routes
  - `devices.write` for PUT/PATCH/DELETE routes

### Devices

- `GET /admin/devices`
  - List all devices registered in DeviceService.
- `GET /admin/devices/:deviceId`
  - Fetch a single device by id.
- `PUT /admin/devices`
  - Upsert a device (full payload required).
- `PATCH /admin/devices/:deviceId`
  - Partial update: any subset of `name`, `direction`, `adapterKey`, `enabled`, `settingsJson`.
- `PATCH /admin/devices/:deviceId/enabled`
  - Enable/disable device.
- `DELETE /admin/devices/:deviceId`
  - Remove a device from DeviceService.

### Adapters

- `GET /admin/adapters`
  - List registered adapters (active + draining).

## Request/Response Contract (proposed)

### Single event request

```json
{
  "eventId": "evt-123",
  "deviceId": "dev-1",
  "direction": "IN",
  "occurredAt": 1769421296000,
  "terminalPersonId": "tp-456",
  "iin": "900101123456",
  "rawPayload": "{\"vendor\":\"dahua\",\"raw\":{...}}"
}
```

### Single event response

```json
{
  "result": "inserted",
  "status": "NEW",
  "personId": "person-1",
  "accessEventId": "event-1"
}
```

Where:
- `result` is `inserted` or `duplicate`
- `status` is Core access event status (`NEW` or `UNMATCHED`)
- `personId` is set if a person was resolved or created
- `accessEventId` is set only if `inserted`

### Batch request (proposed)

```json
{
  "events": [ /* same schema as single */ ]
}
```

### Batch response (proposed)

```json
{
  "results": [
    {
      "eventId": "evt-123",
      "result": "inserted",
      "status": "NEW",
      "personId": "person-1",
      "accessEventId": "event-1"
    }
  ]
}
```

## Authentication

Decision:
- `Authorization: Bearer <token>` shared per Device Service instance
- HMAC request signing:
  - `X-Timestamp`: unix ms
  - `X-Signature`: hex HMAC-SHA256 over `${timestamp}.${rawBody}`
  - Signature uses shared secret and is rejected outside a time window

## Open Decisions

None
