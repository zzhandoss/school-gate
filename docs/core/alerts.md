# Alerts

## Назначение
- Вычисление правил оповещений по monitoring snapshot и уведомление подписчиков.

## Возможности
- Создание и обновление правил (валидация конфигурации через registry).
- Включение/выключение правил и подписок.
- Оценка правил по snapshot и генерация alert events.
- Постановка уведомлений в outbox для доставки (Telegram и др.).

## Сервисы
- `AlertRulesService` — CRUD и валидация правил.
- `AlertSubscriptionsService` — управление подписками на правила.
- `AlertEventsService` — запись и чтение событий алертов.

## Репозитории
- `alertRules.repo`
- `alertSubscriptions.repo`
- `alertEvents.repo`

## Флоу
- `processMonitoringAlerts` — оркестрация: список правил → оценка → события → outbox.

## Сущности
- `AlertRule`, `UnknownAlertRule`
- `AlertEvent`, `AlertEventStatus`, `AlertEventDetails`
- `AlertSubscription`, `AlertRecipient`
- `AlertNotificationRequestedPayload`
- `AlertSeverity`

## UX-ожидания
- Уведомления отправляются только при переходах `resolved ↔ triggered`.
- Невалидные конфиги правил должны явно падать с доменной ошибкой.

## Границы и зависимости
- Вход: `MonitoringSnapshot` (опционально прошлый snapshot).
- Выход: `AlertEvent` + outbox событие `ALERT_NOTIFICATION_REQUESTED`.
- Вся запись и чтение идут через сервисы, репозитории остаются внутренними.

## Как добавить новое правило
- Добавить evaluator и parse-функцию в `packages/core/src/alerts/rules/evaluators/*`.
- Зарегистрировать правило в `packages/core/src/alerts/rules/registry.ts`.
- При необходимости расширить `MonitoringSnapshot` и соответствующие collectors.

## Ошибки (основные)
- `AlertRuleConfigInvalidError`
- `AlertRuleNotFoundError`
