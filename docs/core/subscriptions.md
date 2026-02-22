# Subscriptions

## Назначение
- Управляет подписками родителей на события доступа и заявками на подписку.

## Возможности
- Создание заявки на подписку (pending).
- Проверка дублей заявок.
- Обработка статусов заявок (ready/needs_person/approved/rejected).
- Активация и деактивация подписок.

## Сервисы
- `ParentsService` — запись/чтение родительского профиля (tgUserId, chatId).
- `SubscriptionRequestsService` — управление заявками.
- `SubscriptionsService` — управление подписками.

## Репозитории
- `parents.repo`
- `subscriptionRequests.repo`
- `subscriptions.repo`

## Флоу
- `requestSubscription`
- `reviewSubscriptionRequest`
- `setSubscriptionStatus`

## Сущности
- `Parent`
- `SubscriptionRequest`
- `Subscription`

## UX‑ожидания
- Повторная заявка от одного tgUserId на тот же IIN запрещена.
- Заявка может быть принята только когда готова (ready_for_review) и привязан personId.
- При одобрении создается активная подписка.

## Границы и зависимости
- Это отдельный BC; любые xBC записи делаются через UC.
- Preprocess (auto‑resolve person) выполняется в UC, т.к затрагивает identities.

## Ошибки (основные)
- `SUBSCRIPTION_REQUEST_PENDING_ALREADY_EXISTS`
- `SUBSCRIPTION_REQUEST_NOT_FOUND`
- `SUBSCRIPTION_REQUEST_NOT_PENDING`
- `SUBSCRIPTION_REQUEST_NOT_READY_FOR_REVIEW`
