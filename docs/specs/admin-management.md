# Admin Management API

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

All routes below require permission `admin.manage`.

## Endpoints

### GET /admin/admins

Query:
```
limit=50&offset=0
```

Response:
```json
{
  "success": true,
  "data": {
    "admins": [
      {
        "id": "admin-1",
        "email": "admin@example.com",
        "roleId": "role-1",
        "status": "active",
        "name": "Admin",
        "tgUserId": null,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

Errors:
- 401 `unauthorized`
- 403 `forbidden`
- 400 `invalid_query`

### PATCH /admin/admins/:adminId/status

Request:
```json
{ "status": "active" }
```

Response:
```json
{ "success": true, "data": { "ok": true } }
```

Errors:
- 404 `admin_not_found`
- 401 `unauthorized`
- 403 `forbidden`

### PATCH /admin/admins/:adminId/role

Request:
```json
{ "roleId": "role-2" }
```

Response:
```json
{ "success": true, "data": { "ok": true } }
```

Errors:
- 404 `admin_not_found`
- 404 `role_not_found`
- 401 `unauthorized`
- 403 `forbidden`

### POST /admin/admins/:adminId/password-reset

Request:
```json
{ "expiresInMs": 600000 }
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "reset-token",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:
- 404 `admin_not_found`
- 401 `unauthorized`
- 403 `forbidden`
