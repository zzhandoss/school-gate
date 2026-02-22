# Admin Audit Logs API

All responses use the standard envelope:

```json
{ "success": true, "data": { ... } }
```

```json
{ "success": false, "error": { "code": "string", "message": "string", "data": { "issues": [] } } }
```

Auth header:
```
Authorization: Bearer <jwt>
```

## Endpoints

### GET /admin/audit-logs

Permission: `monitoring.read`

Query:
```
limit=50&offset=0&actorId=admin-1&entityType=subscription&entityId=sub-1&action=subscription_activated
```

Response:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-1",
        "eventId": "evt-1",
        "actorId": "admin-1",
        "action": "subscription_activated",
        "entityType": "subscription",
        "entityId": "sub-1",
        "meta": { "isActive": true },
        "at": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

Errors:
- 400 `invalid_query`
- 401 `unauthorized`
- 403 `forbidden`
