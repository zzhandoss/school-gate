# Admin Auth API

All responses use the standard envelope:

```json
{ "success": true, "data": { ... } }
```

```json
{ "success": false, "error": { "code": "string", "message": "string", "data": { "issues": [] } } }
```

## Auth

Use JWT for admin endpoints.

Header:
```
Authorization: Bearer <jwt>
```

JWT payload includes:
- `sub` (adminId)
- `roleId`
- `permissions[]`

## Endpoints

All endpoints below are available under `/api/auth/*`.

### POST /api/auth/bootstrap/first-admin

Public one-time bootstrap endpoint. Works only when there are no admins in DB.

Request:
```json
{
  "email": "root@example.com",
  "password": "secret",
  "name": "Root Admin"
}
```

Response:
```json
{
  "success": true,
  "data": { "adminId": "admin-1", "roleId": "role-super-admin" }
}
```

Behavior:
- If role `super_admin` does not exist, it is created with full permissions.
- Created admin status is `active`.

Errors:
- 409 `first_admin_already_exists`
- 400 `validation_error`

### POST /admin/auth/login

Request:
```json
{ "email": "admin@example.com", "password": "secret" }
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt",
    "expiresAt": "2026-01-01T00:00:00.000Z",
    "admin": {
      "id": "admin-1",
      "email": "admin@example.com",
      "roleId": "role-1",
      "status": "active",
      "name": "Admin",
      "tgUserId": null
    }
  }
}
```

Errors:
- 401 `invalid_credentials`
- 403 `admin_disabled`

### POST /admin/auth/invites

Auth: required  
Permission: `admin.manage`

Create invite by role id:
```json
{ "roleId": "role-1", "email": "new@example.com", "expiresInMs": 60000 }
```

Create invite by new role:
```json
{
  "roleName": "device-manager",
  "permissions": ["devices.read", "devices.write"],
  "email": "new@example.com",
  "expiresInMs": 60000
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "invite-token",
    "roleId": "role-1",
    "email": "new@example.com",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:
- 404 `role_not_found`
- 409 `role_name_exists`
- 400 `invalid_permission`
- 401 `unauthorized`
- 403 `forbidden`

### POST /admin/auth/invites/accept

Request:
```json
{
  "token": "invite-token",
  "email": "new@example.com",
  "password": "secret",
  "name": "New Admin"
}
```

Response:
```json
{ "success": true, "data": { "adminId": "admin-2", "roleId": "role-1" } }
```

Errors:
- 404 `admin_invite_not_found`
- 410 `admin_invite_expired`
- 409 `admin_invite_used`
- 409 `admin_invite_email_mismatch`
- 409 `admin_email_exists`
- 404 `role_not_found`

### POST /admin/auth/password-resets/request

Request:
```json
{ "email": "admin@example.com", "expiresInMs": 60000 }
```

Response (token is null if email not found):
```json
{ "success": true, "data": { "token": "reset-token" } }
```

### POST /admin/auth/password-resets/confirm

Request:
```json
{ "token": "reset-token", "password": "new-secret" }
```

Response:
```json
{ "success": true, "data": { "adminId": "admin-1" } }
```

Errors:
- 404 `password_reset_not_found`
- 410 `password_reset_expired`
- 409 `password_reset_used`
- 404 `admin_not_found`

### POST /admin/auth/telegram/link-code

Auth: required

Request:
```json
{ "expiresInMs": 300000 }
```

Response:
```json
{
  "success": true,
  "data": {
    "code": "link-code",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:
- 404 `admin_not_found`
- 401 `unauthorized`

### POST /admin/auth/telegram/link-by-code

Request:
```json
{ "code": "link-code", "tgUserId": "tg-123" }
```

Response:
```json
{ "success": true, "data": { "adminId": "admin-1" } }
```

Errors:
- 404 `admin_tg_link_not_found`
- 410 `admin_tg_link_expired`
- 409 `admin_tg_link_used`
- 409 `admin_tg_already_linked`
- 404 `admin_not_found`

### POST /admin/auth/roles

Auth: required  
Permission: `admin.manage`

Request:
```json
{ "name": "viewer", "permissions": ["monitoring.read"] }
```

Response:
```json
{ "success": true, "data": { "roleId": "role-1" } }
```

Errors:
- 409 `role_name_exists`
- 400 `invalid_permission`
- 401 `unauthorized`
- 403 `forbidden`

### PATCH /admin/auth/roles/:roleId

Auth: required  
Permission: `admin.manage`

Request:
```json
{ "permissions": ["monitoring.read", "settings.read"] }
```

Response:
```json
{ "success": true, "data": { "roleId": "role-1" } }
```

Errors:
- 404 `role_not_found`
- 400 `invalid_permission`
- 401 `unauthorized`
- 403 `forbidden`

### GET /admin/auth/roles

Auth: required  
Permission: `admin.manage`

Response:
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role-1",
        "name": "viewer",
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

### GET /admin/auth/roles/:roleId/permissions

Auth: required  
Permission: `admin.manage`

Response:
```json
{
  "success": true,
  "data": {
    "roleId": "role-1",
    "permissions": ["monitoring.read"]
  }
}
```

Errors:
- 404 `role_not_found`
- 401 `unauthorized`
- 403 `forbidden`

### GET /admin/auth/permissions

Auth: required  
Permission: `admin.manage`

Response:
```json
{ "success": true, "data": { "permissions": ["admin.manage", "monitoring.read"] } }
```

Errors:
- 401 `unauthorized`
- 403 `forbidden`
