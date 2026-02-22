# Запуск сервисов системы

Документ описывает:
- порядок запуска сервисов;
- что можно запускать параллельно;
- команды для `dev` и `prod` режимов;
- минимальный сценарий для входа в админку.

## 1. Подготовка (один раз или после обновлений)

```bash
pnpm i
```

Проверь `.env` (можно начать с `.env.example`), затем применить миграции:

```bash
pnpm db:migrate
pnpm device:db:migrate
```

## 2. Порядок первого запуска

Рекомендуемый порядок:
1. `API` (`@school-gate/api`)
2. `Device Service` (`@school-gate/device-service`)
3. `Bot` (`@school-gate/bot`)
4. `Workers` (`@school-gate/worker`)
5. `Admin UI` (`admin-ui`)

Если база пустая, после старта API создай первого админа:

```bash
curl -X POST http://localhost:3000/api/auth/bootstrap/first-admin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"root@example.com\",\"password\":\"password123\",\"name\":\"Root Admin\"}"
```

## 3. Что можно запускать параллельно

После миграций сервисы можно поднимать одновременно:
- API
- Device Service
- Bot
- Workers
- Admin UI

Опционально:
- `adapter-mock` (`@school-gate/adapter-mock`)

## 4. Команды DEV (по сервисам)

```bash
pnpm --filter @school-gate/api dev
pnpm dev:device-service
pnpm --filter @school-gate/bot dev
pnpm dev:workers
pnpm --filter admin-ui dev
```

Опционально mock adapter:

```bash
pnpm adapter:mock:dev
```

## 5. Команда DEV (все вместе)

```bash
pnpm exec concurrently -n api,device-service,bot,workers,admin-ui -c blue,green,magenta,yellow,cyan "pnpm --filter @school-gate/api dev" "pnpm dev:device-service" "pnpm --filter @school-gate/bot dev" "pnpm dev:workers" "pnpm --filter admin-ui dev"
```

## 6. Минимальный сценарий для входа в UI

Достаточно:
1. API
2. Admin UI

```bash
pnpm --filter @school-gate/api dev
pnpm --filter admin-ui dev
```

Если база пустая, один раз вызови `/api/auth/bootstrap/first-admin`.

## 7. PROD-подобный запуск

Сборка:

```bash
pnpm build:packages
pnpm build:apps
```

Старт:

```bash
pnpm --filter @school-gate/api start
pnpm start:device-service
pnpm --filter @school-gate/bot start
pnpm start:workers
pnpm --filter admin-ui preview
```

## 8. Быстрые проверки

- API: `GET http://localhost:3000/health`
- Device Service: `GET http://localhost:4010/health`
- Bot: `GET http://localhost:4100/api/health` (нужен internal bearer token)
- Admin UI: `http://localhost:5000`

## 9. Важные переменные окружения

- `API_CORS_ALLOWED_ORIGINS` — whitelist origin для API (по умолчанию `http://localhost:5000`).
- `DEVICE_SERVICE_CORS_ALLOWED_ORIGINS` — whitelist origin для device-service.
- `VITE_API_BASE_URL` — адрес API для фронтенда.
- `API_AUTH_*` — настройки auth cookie (`name`, `path`, `secure`, `sameSite`).
