# Monitoring

## Назначение
- Операционная картина состояния core: доступность компонентов, состояние воркеров, метрики outbox и access-events.

## Возможности
- Построение мониторинг-снимка (counts/lag/heartbeats/top errors).
- Хранение и просмотр истории снимков.
- Очистка старых снимков.
- Расширение снимка через добавление collector и регистрацию в `monitoring/collectors/index.ts`.

## Сервисы
- `MonitoringService` — собирает актуальный снимок состояния.
- `MonitoringSnapshotsService` — хранит/листает/удаляет снимки.

## Репозитории
- `monitoring.repo`
- `monitoringSnapshots.repo`

## Флоу
- `captureMonitoringSnapshot` — оркестрация `MonitoringService` + `MonitoringSnapshotsService`.

## Сущности
- `MonitoringSnapshot`, `MonitoringSnapshotRecord`
- `ComponentHealth`, `WorkerMonitoring`, `DeviceServiceMonitoring`, `ErrorStat`

## UX-ожидания
- Снимок отражает текущие counts и лаг по access-events/outbox.
- Статус воркера вычисляется по TTL.
- Компоненты отображаются как `ok`/`down`.

## Границы и зависимости
- Зависит от `MonitoringComponentsProvider` для health check компонентов и device-service мониторинга.
- Все чтения/записи снимков проходят через `MonitoringSnapshotsService`.

## Как добавить новый collector
- Создать файл в `packages/core/src/monitoring/collectors` с реализацией `MonitoringSnapshotCollector`.
- Добавить collector в реестр `packages/core/src/monitoring/collectors/index.ts`.
- При необходимости добавить новые типы в `monitoring/entities/*` и использовать их в snapshot.

## Ошибки (основные)
- Доменных ошибок нет — пробрасываются ошибки репозиториев/портов.
