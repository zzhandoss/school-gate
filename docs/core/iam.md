# IAM (Identities & Access)

## Назначение
- Управляет административной идентичностью и доступом: аккаунты, роли, права, инвайты, сброс паролей, Telegram‑коды, токены сессий.

## Возможности
- Логин по email/паролю.
- Логин по Telegram‑коду (purpose=login).
- Связка админа с Telegram (purpose=link).
- Выдача access JWT и refresh токенов с ротацией.
- Инвайты админов и управление ролями/правами.
- Сброс пароля по токену.

## Сервисы
- `AdminsService` — управление админами, логин по email/паролю.
- `RolesService` — роли и права.
- `AdminInvitesService` — инвайты админов.
- `PasswordResetsService` — токены сброса пароля.
- `AdminTgCodesService` — Telegram‑коды с назначением `link|login`.
- `RefreshTokensService` — выпуск/ротация/ревокация refresh токенов.
- `AuthService` — фасад авторизации: стратегии логина + выдача/ротация токенов.

## Репозитории
- `admins.repo`
- `roles.repo`
- `adminInvites.repo`
- `passwordResets.repo`
- `adminTgCodes.repo`
- `refreshTokens.repo`

## Флоу
- `createAdminInvite`, `acceptAdminInvite`, `setAdminRole`
- `requestPasswordReset`, `confirmPasswordReset`, `createAdminPasswordResetLink`
- `getAdminAccess`
- `createTelegramLinkCode`, `linkTelegramByCode`
- `createTelegramLoginCode`

## Стратегии
- `email_password` — email/пароль через `AdminsService.login`.
- `telegram_code` — Telegram‑код с `purpose=login`.

## Сущности
- `Admin`, `Role`
- `AdminInvite`, `PasswordReset`
- `AdminTgCode` (с `purpose`)
- `RefreshToken`

## UX‑ожидания
- Логин возвращает access JWT и refresh‑токен.
- Refresh токен одноразовый и ротируется при обновлении.
- Telegram‑коды разделены по назначению: link‑код не может логинить.
- Админ со статусом `active` только тогда может логиниться.

## Границы и зависимости
- Внутренние записи/чтения — через сервисы IAM.
- JWT‑подпись через порт `JwtSigner` (infra).
- Refresh‑hash через `PasswordHasher` (argon2).
- Cross‑BC reads только через query‑ports, если понадобятся.

## Ошибки (основные)
- `ADMIN_NOT_FOUND`, `ADMIN_DISABLED`
- `ADMIN_INVITE_*`, `PASSWORD_RESET_*`
- `ADMIN_TG_*`, `ADMIN_TG_CODE_PURPOSE_MISMATCH`
- `REFRESH_TOKEN_*`
