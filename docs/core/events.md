# Events (Access Events)

## Назначение
- Управляет потоком событий доступа (ingest, хранение, обработка статусов).

## Возможности
- Идемпотентное сохранение событий доступа.
- Пометка статусов (new/unmatched/processed/failed).
- Выдача батчей на обработку с lease/processingBy.
- Подготовка событий к повторной обработке по привязке terminal identity.

## Сервисы
- `AccessEventsService` — write‑gate к событиям доступа (insert/claim/mark/delete).

## Репозитории
- `accessEvents.repo`

## Флоу
- Нет (операции обслуживаются одним сервисом).

## Сущности
- `AccessEvent`
- `AccessEventStatus`, `AccessEventDirection`

## UX‑ожидания
- Повторная загрузка одного и того же события не создает дубль.
- Событие без привязки помечается как `UNMATCHED`.
- Обработка с подписками генерирует уведомления и фиксирует `PROCESSED`.

## Границы и зависимости
- Внутренние записи/чтения — только через `AccessEventsService`.
- Cross‑BC обработка (подписки/идентичности) выполняется в usecase.

## Ошибки (основные)
- `INVALID_IIN`
- `TERMINAL_IDENTITY_ALREADY_MAPPED`
