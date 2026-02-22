# Retention

## Назначение
- Управляет периодической очисткой исторических данных по правилам retention.

## Возможности
- Расчет cutoff по дням для access events и audit logs.
- Удаление только терминальных access events (PROCESSED/UNMATCHED/ERROR).
- Пакетное удаление audit logs до cutoff.
- Pipeline-подход для добавления новых шагов retention без переписывания логики.

## Сервисы
- `AccessEventsRetentionService` — write‑gate для удаления терминальных access events.
- `AuditLogsRetentionService` — write‑gate для удаления audit logs.

## Репозитории
- `accessEventsRetention.repo`
- `auditLogsRetention.repo`

## Флоу
- `cleanupRetention.flow` — последовательная очистка по шагам (pipeline).

## Сущности
- Нет.

## UX‑ожидания
- Очистка идет батчами (limit/batch).
- Не затрагиваются access events со статусами вне терминальных.
- Cutoff вычисляется относительно `now` и настроек `*_days`.

## Границы и зависимости
- Внешние usecases используют `cleanupRetention.flow` как оркестрацию.
- Репозитории и сервисы не содержат бизнес‑логики за пределами retention.

## Ошибки (основные)
- Нет доменных ошибок.
