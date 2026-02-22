# Identities

## Назначение
- Управляет персонами и их привязками к терминальным идентификаторам.

## Возможности
- Создание и поиск персон по IIN.
- Поиск по префиксу IIN.
- Привязка terminalPersonId к personId.
- Список терминальных идентификаторов по персоне.

## Сервисы
- `PersonsService` — CRUD и поиск по IIN.
- `PersonTerminalIdentitiesService` — управление связями person ↔ terminal identity.

## Репозитории
- `persons.repo`
- `personTerminalIdentities.repo`

## Флоу
- Нет (операции идут через сервисы).

## Сущности
- `Person`
- `PersonTerminalIdentity`

## UX‑ожидания
- Поиск по IIN: 12 цифр → точное совпадение, иначе префикс.
- Привязка terminal identity влияет на последующую обработку событий.

## Границы и зависимости
- Это отдельный BC; любые xBC записи делаются через UC (например `mapPersonTerminalIdentity`).
- Cross‑BC reads только через query‑ports, если понадобятся.

## Ошибки (основные)
- `PERSON_NOT_FOUND`
- `TERMINAL_IDENTITY_ALREADY_MAPPED`
