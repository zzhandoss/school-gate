# Admin Subscriptions API

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

### GET /admin/subscriptions

Permission: `subscriptions.read`

Query:
```
limit=50&offset=0&personId=person-1&tgUserId=tg-1&onlyActive=true
```

Response:
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub-1",
        "tgUserId": "tg-1",
        "personId": "person-1",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "person": {
          "id": "person-1",
          "iin": "123456789012",
          "firstName": "Ivan",
          "lastName": "Ivanov"
        },
        "parent": {
          "tgUserId": "tg-1",
          "chatId": "chat-1"
        }
      }
    ]
  }
}
```

Errors:
- 400 `invalid_query`
- 401 `unauthorized`
- 403 `forbidden`

### POST /admin/subscriptions/:subscriptionId/activate

Permission: `subscriptions.manage`

Response:
```json
{ "success": true, "data": { "subscriptionId": "sub-1", "isActive": true } }
```

Errors:
- 404 `subscription_not_found`
- 401 `unauthorized`
- 403 `forbidden`

### POST /admin/subscriptions/:subscriptionId/deactivate

Permission: `subscriptions.manage`

Response:
```json
{ "success": true, "data": { "subscriptionId": "sub-1", "isActive": false } }
```

Errors:
- 404 `subscription_not_found`
- 401 `unauthorized`
- 403 `forbidden`
