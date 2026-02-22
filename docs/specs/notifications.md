# Notifications (Telegram)

## Overview
- Outbox worker renders a text template and delivers it to the local Bot service.
- Bot service holds the Telegram token and sends messages to Telegram API.
- Worker checks bot health before claiming outbox events; if bot is down, claims are skipped.

## Runtime Settings
- Key: `notifications.parent_template`
- Default (env): `{{firstName}} {{lastName}} {{directionWord}} школу. Время: {{time}}`

### Available template variables
- `firstName` / `lastName`
- `fullName`
- `direction` (`IN` | `OUT`)
- `directionWord` (`вошел` | `покинул`)
- `time` (localized string, `ru-RU`)
- `occurredAt` (ISO string)
- `personId`, `deviceId`, `accessEventId`, `tgUserId`

> Note: Mustache escapes values by default. Use `{{{var}}}` for unescaped output.

## Bot internal API
All endpoints require `Authorization: Bearer <BOT_INTERNAL_TOKEN>`.

### `GET /api/health`
Response:
```json
{ "success": true, "data": { "ok": true } }
```

### `POST /api/notification/send`
Request:
```json
{ "chatId": "123456789", "text": "..." }
```

Response:
```json
{ "success": true, "data": { "sent": true } }
```
