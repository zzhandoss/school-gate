# Settings (Runtime)

## Назначение
- Управляет runtime‑настройками, которые хранятся в БД и переопределяют env конфиг.

## Возможности
- Чтение runtime‑override для воркеров/подсистем.
- Запись runtime‑override в БД.
- Снимок настроек с разницей env/db/effective для админ‑UI.

## Сервисы
- `SettingsService` — чтение/запись runtime‑настроек и снимок.

## Репозитории
- `settings.repo`

## Флоу
- Нет (операции обслуживаются одним сервисом).

## Сущности
- `SettingRow`, `SettingWrite`

## UX‑ожидания
- Изменения в БД сразу отражаются как overrides.
- Снимок показывает значения env, db и итоговые effective.

## Границы и зависимости
- Все записи/чтения — через `SettingsService`.
- Зависит от `RuntimeConfigProvider` для env/effective значений.

## Ошибки (основные)
- `Invalid setting <key>: ...` при некорректном значении в БД.
