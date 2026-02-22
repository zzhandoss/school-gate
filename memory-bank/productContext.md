# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2026-01-25 21:52:45 - Log of updates made will be appended as footnotes to the end of this file.

## Project Goal

- Build a school access system backend that ingests FaceID terminal events and notifies parents in Telegram.
- Manage the subscription workflow that links parents to a child by IIN and requires admin approval.

## Key Features
- Persons module pagination: `/api/persons` and AdminUI `/persons` now expose/use server page metadata (`limit`, `offset`, `total`) with URL-synced filters for scalable person directory navigation.
- Subscription requests queue UX v2: server-backed pagination with status-aware history browsing (pending + old requests), URL-synced filters, and table-scoped loading for moderation workflows.
- Audit coverage expansion: core services/flows emit structured audit events across IAM, subscriptions, settings, alerts, identities, and retention with unified outbox enqueue wiring.

- Dashboard permission model: dashboard shell is always accessible for authenticated admins, while each widget loads independently based on required permissions and can be absent without blocking the page.
- Admin invite share UX: after invite creation, admins can copy both raw invite code and full registration URL for direct delivery to invited users.
- AdminUI Device Operations module: protected `/devices`, `/devices/adapters`, and `/devices/monitoring` pages with permission-aware device CRUD and DS health visibility powered by `/api/ds/*`.
- Admin self-profile management API: authenticated admin can update own email/name via PATCH /api/auth/me with validation and email uniqueness enforcement.
- Parent flow: Telegram bot, IIN submission, subscription request creation.
- Admin flow: review queue, approve only when person is resolved, reject otherwise; all actions audited.
- Pre-processing: resolve person by IIN from local DB, or via terminal adapters behind a feature flag.
- Terminal integrations: multiple schools and devices; a person can exist on multiple terminals.
- Notifications: child entry/exit events delivered to parents in Telegram.
- Bot delivery service: local bot API sends Telegram messages; outbox checks bot health before claiming notifications; templates configurable via runtime settings.
- Outbox processing and worker loops for background tasks.
- SQLite database schema and migrations via Drizzle ORM.
- DeviceService transport: device outbox worker pushes normalized access events to Core via HTTP with retries.
- Config management: packages/config loads .env and validates typed configs with zod across workers, device service, and DB tooling.
- DB-backed runtime settings: worker configs can be overridden via the settings table and validated in core usecases.
- Admin-ready runtime settings snapshot: core exposes env/db/effective values via ports and usecases for future admin endpoints.
- Hono API delivery: composition root + middleware validation + pino request logging with runtime settings admin routes.
- OpenAPI delivery docs: apps/api serves `/openapi.json` and `/docs` (Scalar), and routes are declared via OpenAPIHono with shared response-envelope docs.
- Core ingestion API: `/api/events` and `/api/events/batch` accept normalized device events with bearer+HMAC auth and idempotent ingestion.
- DeviceService registry: admin manages devices in DS; DS validates device assignment/direction before forwarding to Core.
- DeviceService admin devices: GET by id, PATCH partial update, DELETE, and adapters list for UI selection.
- Unmatched access events admin flow: admins can list unmatched events and map terminal identities to persons to requeue processing.
- Persons search admin flow: admins can search persons by IIN with exact-or-prefix behavior to support mapping workflows.
- Subscription requests admin API: admins can list pending requests and review (approve/reject) via transactional core usecases.
- Retention cleanup: a dedicated retention worker deletes old terminal access events and audit logs using configurable runtime settings.
- Scheduled retention (user-level): retention can run as a one-shot task registered per user via OS scheduling (Task Scheduler / crontab).
- Retention schedule admin action: admin API can apply/update the per-user retention schedule directly from the backend.
- Retention lifecycle admin actions: admin API can run retention immediately and remove the per-user schedule.
- Admin monitoring snapshot: `/admin/monitoring` exposes queue counts and lag markers for access events and outbox.
- Operational monitoring signals: worker heartbeats and top error aggregation are exposed via `/admin/monitoring` for prod-style visibility.
- Monitoring v2 status signals: `/admin/monitoring` marks worker heartbeats as ok/stale using configurable TTL.
- Alerting backend: alert rules/subscriptions/events evaluated against monitoring snapshots with Telegram delivery via outbox.
- DeviceService reliability: device cursors and backfill support reliable delivery to Core with ack-driven cursor advance.
- DeviceService adapter API: adapters register/heartbeat/push events into DS (Hono server), which assigns devices and manages cursors for backfill.
- DeviceService backfill runner: DS pulls adapter backfill via HTTP when adapters register/heartbeat, throttled by heartbeat interval.
- Mock adapter service: standalone adapter with SQLite raw-event store, backfill endpoint, and push/heartbeat loops for DS integration testing.
- Standardized API response envelope: all endpoints return `{ success, data?, error? }` with structured error codes/messages/data.
- Admin roles and permissions model: admin/roles schema with preset roles and permission keys for upcoming auth flows.
- Admin auth primitives: invites, password resets, and Telegram link codes with argon2 password hashing and token hashing.
- Admin auth delivery: JWT login, admin auth/roles endpoints, and permission-guarded admin APIs.
- First-admin bootstrap: public one-time backend endpoint creates first `super_admin` in empty DB and then locks itself once any admin exists.
- Admin management: list admins, update status/role, and issue admin-triggered password reset links.
- Admin subscriptions and audit logs: list subscriptions, activate/deactivate with audit events, and list audit logs for operations.
- Auth session tokens: access JWT + refresh tokens with rotation, stored device/ip/userAgent metadata, and argon2-hashed refresh secrets.
- Hybrid auth session flow: bearer-first API auth with HttpOnly secure cookies, `/api/auth/session` for session restore, and `/api/auth/logout` for refresh revocation + cookie cleanup.
- Telegram login codes: admin login via one-time Telegram codes distinct from link codes.
- Admin Web UI iteration 1: auth + operations dashboard in `apps/admin-ui` with session restore/refresh and live monitoring/request widgets backed by `/api/*`.
- Admin Web UI resilience: configurable API base URL (`VITE_API_BASE_URL`), global auth gate for all protected routes, and dedicated fallback pages for not-found/error/backend-unavailable states.
- Admin invite onboarding UI: public `/invite` registration flow with tokenized invite acceptance, password confirmation, auto-login, and friendly auth error handling.
- Telegram parent bot MVP (Telegraf): long polling in `apps/bot`, private-chat-only parent flows, request-by-IIN, subscription status dashboard, and inline activate/deactivate actions.

## Overall Architecture

- Clean Architecture: core domain/usecases/ports, infra adapters (Drizzle repos), db schema/migrations, worker entrypoints.
- Repository pattern for data access and ports for external services (audit log, person resolver).
- Core services layer (auth/admin) gates repository access; repos expose `withTx` for sync transaction wiring.
- IAM bounded context owns identities and access (admins, roles, invites, password resets, telegram links).
- Cross-BC reads use read-only query ports; cross-BC writes are implemented as usecases.
- PersonResolver abstraction to avoid tight coupling to a specific terminal vendor (Dahua adapter planned).
- Outbox pattern for event processing and polling workers for background tasks.
- Sync UnitOfWork ensures review transactions are atomic and enqueue outbox events; outbox uses lease reclaim and audit deduplication.
- Monorepo layout: apps/ for entrypoints (worker, device service, API, bot, UI) and packages/ for core, infra, db, and tests.
- DeviceService has its own internal package (packages/device) with core/infra/device-db modules and separate SQLite schema/migrations.
- Device registry and device admin APIs live in DeviceService; Core remains device-agnostic beyond deviceId and mapping workflows.

2026-01-25 21:55:41 - Initialized from repo structure and usecases; project goal still needs confirmation.
2026-01-25 22:01:12 - Updated with user-provided project idea and roadmap (Telegram notifications, terminals, admin flow).
2026-01-26 00:02:46 - Architecture update: transactional review via sync UnitOfWork, outbox lease reclaim, and audit log dedup.
2026-01-26 19:59:32 - Architecture update: Restructured repo into monorepo layout: apps/worker (entrypoints), packages/core, packages/infra, packages/db, packages/test, and updated scripts/config/imports to new paths; added apps/device-service package placeholder and workspace config.
2026-01-26 21:18:57 - Architecture update: Added DeviceService internal package at packages/device with core/infra/device-db modules, separate device DB schema/migrations, device UoW, repos, and usecases, plus device db CLI commands and tests under packages/test/device.
2026-01-27 11:37:03 - New feature: Implemented DeviceService transport for HTTP push: added CoreIngestClient port, fetch-based HTTP client, device outbox batch processor usecase, device outbox worker entrypoint and config, root device:dev script, and tests for outbox processing behavior.
2026-01-27 12:08:04 - New feature: Added packages/config with .env loader + zod validation, created .env.example, wired configs into worker/device-service entrypoints and drizzle configs, and fixed worker outbox import paths.
2026-01-27 12:34:22 - New feature: Implemented DB-backed runtime settings on top of env config: added settings repo/usecases, extended config overrides, wired workers to load settings from DB, and added runtime settings test.
2026-01-27 12:47:23 - New feature: Added admin-ready runtime settings snapshot flow: core runtime config types, runtime config provider port+infra adapter, listRuntimeSettingsSnapshot usecase, runtime settings service, and snapshot tests; refactored keys/types into core config module.
2026-01-27 13:58:13 - New feature: Added Hono API composition root with pino request-context logging, zod contracts package, middleware-based JSON validation, and runtime settings admin routes (GET snapshot + PATCH set); updated api entrypoint and config exports.
2026-01-27 16:41:42 - New feature: Implemented Core ingestion API with HMAC auth: added access events contracts and routes (/api/events, /api/events/batch), verifyIngestAuth middleware using bearer+HMAC, API wiring with ingest UC and inline queue, device HTTP client signing, updated .env.example and device service config, and added API ingestion tests.
2026-01-27 17:09:01 - New feature: Implemented strict devices registry in Core: added devices.enabled column and migration, expanded core DevicesRepo, added devices usecases (list/upsert/setEnabled), added drizzle devices repo, added admin routes /admin/devices, enforced device registration+enabled checks in ingestAccessEvent, mapped domain errors in accessEvents routes, and updated API/UC tests.
2026-01-27 17:56:20 - New feature: Added admin unmatched access events API: contracts for unmatched list and terminal identity mapping, new routes /admin/access-events/unmatched and /admin/access-events/mappings, wired createListUnmatchedAccessEventsUC and createMapPersonTerminalIdentityUC in API composition root, updated existing API tests to provide new handlers, and added new admin API tests for unmatched listing and mapping requeue.
2026-01-27 18:04:57 - New feature: Added admin persons search API with exact-or-prefix behavior: extended PersonsRepo with searchByIinPrefix, implemented prefix search in drizzle repo, added createSearchPersonsByIinUC (exact for 12 digits else prefix), added contracts and /admin/persons route, wired it in API composition root, updated existing API tests for new DI, and added persons API tests.
2026-01-27 18:34:29 - New feature: Standardized API response format to { success, data?, error? }: added contracts for api error/success, introduced response helpers, updated middleware/auth/onError and all admin/ingest routes to wrap responses and errors with codes/messages/data, updated device HTTP client error parsing to handle new format, and updated API tests to assert the new response envelope plus added missing behavior tests.
2026-01-27 19:21:08 - New feature: Added admin API for subscription requests: contracts, routes, wiring in API composition root, updated DI stubs in existing API tests, and added subscription requests API tests. Typecheck passes.
2026-01-27 19:41:55 - New feature: Added retention cleanup: runtime settings and env config for retention, core cleanupRetention usecase, retention repos, retention worker entrypoint wired into runAll, and retention UC tests.
2026-01-27 20:00:28 - New feature: Added user-level scheduled retention support: retention run-once and apply-schedule scripts, OS-aware scheduling via schtasks/crontab, retention runtime settings/env keys integrated into core snapshot/set/get and API contracts, retention cleanup UC + repos + tests, and retention removed from runAll default entries with new scripts.
2026-01-27 20:17:02 - New feature: Added admin retention schedule apply endpoint by extracting schedule logic into infra service, wiring /admin/retention/schedule/apply in API, adding retention admin contracts, updating API test DI stubs, and adding a retention schedule API test. Typecheck passes.
2026-01-27 20:31:19 - New feature: Added retention lifecycle admin endpoints: extended retention ops service with runRetentionOnce and removeRetentionSchedule, added /admin/retention/run-once and /admin/retention/schedule/remove routes and contracts, updated API composition root and retention CLI scripts, and updated API DI stubs/tests. Typecheck passes.
2026-01-27 20:51:16 - New feature: Added admin monitoring snapshot: core monitoring port and getMonitoringSnapshot usecase, Drizzle monitoring repo aggregating access events and outbox counts + lag markers, monitoring contracts and /admin/monitoring route, API wiring, updated DI stubs in API tests, and added monitoring API test. Typecheck passes.
2026-01-27 21:28:29 - New feature: Prod-like monitoring: added worker heartbeats schema+ports+repo, wired heartbeats into workers and retention run-once, and extended /admin/monitoring contracts/routes/tests with workers and top errors.
2026-01-27 22:47:35 - New feature: Monitoring v2: added monitoring worker TTL runtime setting, computed worker status (ok/stale) with ttl in monitoring snapshot, updated contracts/routes/tests and config/.env.
2026-01-28 00:49:48 - New feature: DeviceService reliability: added device cursors table+repo, backfill usecase, and cursor advancement on Core ack in device outbox processor; updated device outbox worker and tests.
2026-01-28 01:05:12 - New feature: DeviceService adapter API contracts: added adapter registry, register/heartbeat/events endpoints (HTTP server), assignments usecase, and device service config/env keys.
2026-01-28 09:22:53 - New feature: DeviceService adapter backfill runner: added adapter HTTP client for fetchEvents, backfill runner triggered on register/heartbeat, and DS adapter API contracts/tests for assignments/backfill runner.
2026-01-28 10:40:01 - New feature: Added mock adapter service under apps/adapters/mock with SQLite raw-events store, DeviceService client, backfill HTTP server, runtime loops (register/heartbeat/push/backfill/generate), plus adapter config in packages/config and env example updates. Added adapter events repo tests and updated workspace globs.
[2026-01-28 23:22:11] - Architecture update: Move device registry out of Core into DeviceService; Core ingestion no longer enforces device registration; DS admin devices API added; DS API now uses Hono; device DB schema adds name column (requires device:db:generate+migrate).
[2026-01-29 17:42:28] - New feature: Expanded DeviceService admin devices endpoints (GET by id, PATCH partial update, DELETE) and added admin adapters list endpoint. Added new device usecases (get/update/delete), repo delete method, adapters contracts, and tests for new routes.
[2026-01-29 19:45:45] - New feature: Stage 1 auth groundwork: added admin/roles schema, core permission list + preset roles, and tests for preset validity; exported new admin schema and core auth exports.
[2026-01-29 20:06:59] - New feature: Stage 2 auth base: added admin invites/password resets/tg links schema, core repos+usecases for invites/login/reset/tg link, roles repo, argon2 password hasher + token hasher in infra, and tests for roles/invites/reset/tg link.
[2026-01-29 21:25:48] - New feature: Stage 3 admin auth: JWT auth middleware with permissions guard, admin auth/roles routes, new contracts for auth DTOs, API composition root wiring with jose JWT, role name duplication guard, new admin auth API tests, and admin route permission enforcement. Added helper for test stubs.
[2026-01-30 00:37:59] - New feature: Added admin management endpoints (list admins, update status/role, admin-triggered password reset link), new core usecases and contracts; JWT payload now includes permissions. DeviceService admin routes now require JWT permissions (devices.read/write) with new admin auth middleware and config. Added admin management API docs and updated device-service spec; updated tests to include admin auth and new admins API tests.
[2026-01-30 01:56:39] - New feature: Added Telegram notification delivery via bot service with internal HTTP API, mustache template runtime setting, and outbox pre-claim bot health check; introduced bot and notifications env configs, runtime settings keys/snapshot updates, tests, and docs.
[2026-01-30 17:04:46] - New feature: Wired admin roles/permissions list endpoints, admin subscriptions and audit logs APIs, plus tests and docs. Added API composition root wiring for new usecases, subscriptions/audit logs handlers, and list roles/permissions handlers; added stubs and new API tests; documented new endpoints.
[2026-01-30 23:38:39] - New feature: Implemented alerts backend (rules/subscriptions/events, evaluation, Telegram outbox), added DB schema/migration, API routes/contracts, monitoring worker integration, tests, and updated NotificationSender; added new errors. Noted new coding rules: optional fields require | undefined and schema imports without /index. No default alert rule seeding yet.
[2026-02-03 17:08:02] - Architecture update: Introduced core services layer for auth/admin with withTx support; added auth types module; updated repo interfaces and infra repos with withTx; refactored auth/admin UCs to use services; updated API composition modules and tests; added core services export.
[2026-02-03 19:21:42] - Architecture update: Defined IAM bounded context for identities/access and introduced read-only query ports for cross-BC reads; cross-BC writes are handled by usecases.
[2026-02-03 22:15:17] - Architecture update: Refactored core auth/admin into IAM BC with new services/flows, moved auth constants and repos into iam, added query ports under ports/queries/iam, removed auth/admin UC files, updated tests to use IAM services/flows, added compatibility re-exports for old auth/repos paths, added core package exports for iam and query ports.
[2026-02-03 22:46:19] - Architecture update: Refined IAM by moving entity types into iam/entities and grouping flows into auth/access/admin/telegram subfolders; updated query ports and core exports accordingly.
[2026-02-04 02:27:09] - New feature: Implemented IAM auth scaffolding: added auth service with JWT issuance and refresh rotation; added auth strategies (email/password, telegram code); added refresh tokens entity/repo/service and ports for jwtSigner and refreshTokenHasher; added refresh token errors; added refresh_tokens DB table and migration; moved password reset flows to flows/password-reset and updated exports; removed adminLogin flow and searchPersonsByIin/listPending flows per single-service rule. Updated IAM index and core package exports.
[2026-02-04 03:21:30] - New feature: Added createTelegramLoginCode flow (linking to admin tg codes with purpose=login) and exported it from IAM index. No migrations touched per rule.
[2026-02-09 05:30:26] - New feature: Integrated OpenAPI + Scalar into apps/api: switched delivery routes to OpenAPIHono with documented route declarations, added /openapi.json and /docs endpoints, and centralized route OpenAPI envelope/error response helper.
[2026-02-09 19:51:58] - New feature: Implemented Admin UI iteration 1 in apps/admin-ui: replaced starter root flow with real auth+dashboard experience. Added /login and /dashboard routes with auth guards and redirect logic from /. Built shadcn-style UI primitives and pages based on login-04 and a lightweight dashboard-01 shell. Implemented API client with envelope parsing, bearer auth, single-flight refresh retry on 401, session storage in memory+localStorage, and auth service (login/refresh/logout). Wired dashboard to live data from /api/monitoring and /api/subscription-requests. Added lint ignores for build artifacts/config files and added unit tests for envelope parsing so app tests run.
[2026-02-09 20:38:30] - New feature: Enhanced admin-ui reliability and routing behavior. Added configurable backend base URL via VITE_API_BASE_URL with default http://localhost:3000 and .env.example. Hardened route access by adding global auth gate in root route (only /login and /unavailable are public), keeping dashboard guarded for unauthenticated redirects. Implemented fallback pages: global not-found page, global error page, and dedicated /unavailable page. Added network failure handling in API client (server_unreachable) and automatic redirect to /unavailable from login/dashboard when backend is unreachable.
[2026-02-09 21:54:12] - New feature: Implemented Telegram bot MVP foundation in apps/bot with Telegraf long polling, parent menu flows (new subscription request, my subscriptions, help), inline toggle actions, and integration with core/infra subscriptions flows. Added core/infra support for parent-owned subscription status change flow and listing subscription requests by tgUserId, plus targeted tests for bot helpers, repos, and new flow.
[2026-02-09 22:13:42] - New feature: Implemented invite registration UI flow in apps/admin-ui using shadcn + best practices. Added public /invite route with token query handling and missing-token fallback state; updated root auth guard allowlist to include /invite. Added react-query provider and query client setup, invite form built with react-hook-form + zod resolver, password confirmation validation, and mutation-based submit flow. Extended auth service with acceptInvite and acceptInviteAndLogin (auto-login after invite acceptance). Added centralized auth error mapping and updated login screen to reuse friendly error messages and link to invite registration. Added unit tests for auth error mapping and invite schema validation.
[2026-02-09 22:27:46] - New feature: Добавлен backend-only first-admin bootstrap: новый endpoint POST /api/auth/bootstrap/first-admin, IAM flow createFirstAdmin с автосозданием роли super_admin и выдачей первого active admin, плюс контракты/ошибки/документация и API тесты bootstrap+login.
[2026-02-09 23:38:38] - New feature: Implemented hybrid admin auth with bearer-first and HttpOnly cookie fallback; added /api/auth/session and /api/auth/logout; login/refresh now set auth cookies; CORS credentials enabled with explicit origin whitelist defaults updated to localhost:5000; added auth cookie config in env; added API tests for cookie/session/logout and updated root RUN_SERVICES.md runbook.


- [Admin UI auth onboarding]: Invite registration and password reset flows added with public routes and consistent form UX. 
[2026-02-09 22:28:27] - New feature: Admin UI invite onboarding + password reset flows with public routes, shadcn-based forms, react-query integration, auth error mapping reuse, and validation/test coverage.

- [First admin bootstrap UI]: Added one-time initialization flow in admin-ui with immediate sign-in and dashboard redirect. 
[2026-02-09 22:35:26] - New feature: Added admin-ui first-admin bootstrap flow (public route + form + API integration + error handling + tests) for initializing empty system via /api/auth/bootstrap/first-admin.
- Admin bot access bootstrap: admins can link Telegram directly in bot via `/link <code>` (IAM one-time code) and then use admin mode placeholder/menu in the same bot process.
[2026-02-09 23:38:06] - New feature: Implemented admin Telegram linking and dual-mode Parent/Admin UX in apps/bot using Telegraf with /link <code>, mode switch buttons, admin menu placeholder, and composition wiring to IAM link flow and admin access by tgUserId. Added bot unit tests for /link command parsing and menu rendering.
[2026-02-10 05:31:35] - Architecture update: Reworked admin-ui auth flow to TanStack Start best-practice server-function session resolution with HttpOnly cookie forwarding and root route context hydration for client useSession. Removed redundant per-route auth requests and centralized auth gating in root beforeLoad.
[2026-02-10 05:51:29] - New feature: Enhanced admin-ui shell UX: added header profile section with avatar and custom dropdown (settings/profile soon, role text, sign out), and implemented desktop-collapsible sidebar while preserving mobile drawer behavior.
[2026-02-10 05:58:21] - New feature: Admin UI account UX iteration: removed Settings item from profile dropdown, added protected /profile route with profile editing form and Telegram link-code generation flow, wired app-shell navigation to profile, and kept sign-out in dropdown. Profile save now targets PATCH /api/admins/me (shows explicit guidance if endpoint is missing).
[2026-02-10 06:04:15] - New feature: Updated admin-ui session model to support roleName and permissions from /api/auth/session and switched role display from roleId to roleName (with roleId fallback) in app shell and profile page.
[2026-02-10 06:07:53] - New feature: Implemented backend update-my-profile flow for admin auth: added PATCH /api/auth/me contract + route + feature wiring, added AdminsService/AdminsRepo setProfile with email uniqueness check, implemented Drizzle setProfile update, and updated auth API tests/stubs.

[2026-02-10 06:55:32] - New feature: Added dedicated admin-ui Alerts page (/alerts) with human-friendly shadcn UI, integrated alerts APIs, and per-admin subscription controls.
[2026-02-10 07:15:40] - New feature: Added responsive alert rule creation in admin-ui (Sheet desktop, Drawer mobile) with type-aware config form and direct API integration.

- [2026-02-10 19:54:00] - New feature: Refactored admin-ui runtime settings page from section cards list to shadcn Tabs with per-tab lazy loading and section-scoped refresh/save flow.
[2026-02-10 20:43:02] - New feature: Implemented admin-ui Device Operations UI in apps/admin-ui with protected routes (/devices, /devices/adapters, /devices/monitoring), sidebar navigation updates, DS API service/types for /api/ds/*, permission-aware devices CRUD (sheet/drawer create-edit, enable/disable switch, delete confirmation), adapters operational read-only view, monitoring overview/tables/outbox block, tests for DS service, and ran lint/test/build successfully.


- Device-service gateway in API: /api/ds/* forwards admin device/adapters and internal monitoring requests to pps/device-service using existing contracts and envelope/error mapping.
[2026-02-10 20:46:31] - New feature: Implemented apps/api device-service gateway endpoints under /api/ds with composition feature forwarding to device-service, auth permission guards, upstream error mapping, runtime wiring reuse, and focused API tests for gateway happy/error cases.

- [2026-02-10 20:50:24] - New feature: Implemented device-service integration end-to-end: backend gateway routes under /api/ds/* in apps/api and new admin-ui Device Operations module (devices, adapters, monitoring) with shadcn UX and permissions-aware actions.

- Admin management UI module: protected admins and roles pages with invite creation, role assignment, status controls, and permission editing for operational IAM management in AdminUI.
[2026-02-10 22:27:54] - New feature: Implemented admin management module in admin-ui with /admins and /admins/roles, invite + status/role management, and role permission editing using shadcn components; validated via lint/test/build.

- Admin management safety controls: UI prevents self role downgrade and protects the last active super_admin from disable actions to reduce accidental lockouts.
[2026-02-10 23:26:36] - New feature: Added admin-management safety guards in admin-ui: blocked self role changes and blocked disabling the last active super_admin, with corresponding disabled controls and helper hints in admins table. Verified via lint and tests.

- Admin invite role composition: IAM invite flow can select existing role or compose a new role with permissions inline before issuing invite.
[2026-02-11 00:22:08] - New feature: Extended admin invite creation flow in admin-ui to support role source selection: use existing role or create a new role inline with permissions and immediately issue invite. Wired permissions loading into admins page and passed to invite panel/form. Verified with lint and tests.

- Invite role presets: new-role invite flow includes one-click Viewer/Operator/Admin permission presets to speed up admin onboarding with manual override support.
[2026-02-11 00:40:17] - New feature: Added role permission presets to admin invite new-role flow in admin-ui: Viewer, Operator, Admin one-click presets with manual fine-tuning retained. Verified by lint and tests.

- Subscription requests operations UI: dedicated moderation page with filters and approve/reject flow powered by /api/subscription-requests, including permission and Telegram-link guardrails.
[2026-02-11 01:22:30] - New feature: Implemented admin-ui Subscription Requests module: new route /subscription-requests, sidebar navigation entry (permission-aware), API service for list/review calls, table-based review UI with filters (only/order), approve/reject actions using adminTgUserId, and graceful unavailable/error/access handling. Refactored into small files to keep under line limits. Verified with lint/test/build and routeTree generation.

- Access events moderation UI: dedicated unmatched events page with terminal identity mapping workflow and person lookup, backed by /api/access-events/unmatched,/mappings and /api/persons.
[2026-02-11 01:49:55] - New feature: Implemented admin-ui Access Events module: added /access-events route, permission-aware sidebar navigation entry, unmatched events data service, terminal identity mapping flow with Sheet/Drawer form, inline person search by IIN via /api/persons, and graceful error/unavailable handling. Added split components to keep files under line limit and verified lint/test/build.

* Telegram OTP Login: Email-based sign-in sends a one-time 6-digit code to linked Telegram and completes secure cookie session without localStorage tokens.
[2026-02-11 03:15:53] - New feature: Implemented Telegram OTP auth flow (email -> code to linked Telegram -> verify code) across API/contracts/core and admin-ui login UI with cookie session continuation, plus tests and error mappings.

- Persons management module: AdminUI now includes /persons and /persons/:id for profile management and device-scoped identity bindings, backed by expanded /api/persons CRUD + identity routes.
[2026-02-11 04:21:14] - New feature: Implemented full persons management in admin-ui and api: persons list/create/update/details pages with device-scoped identities CRUD. Extended contracts/core/infra/api persons layers and integrated navigation and permission-gated flows.
[2026-02-11 04:58:12] - New feature: Enhanced admin invite creation UX in admin-ui: added separate copy actions for invite code and full invite URL (/invite?token=...), with generated absolute link based on current origin for immediate sharing.
[2026-02-11 05:16:24] - New feature: Refactored admin-ui dashboard permission behavior: dashboard route remains available to authenticated users, while monitoring and subscription request widgets load/render independently by permissions with per-widget error handling and empty-state when no widgets are available.


- Access events full stream UI/API: admins can browse all access events (not only unmatched) with status/device/identity/date filters and server-side pagination while keeping terminal mapping actions only for UNMATCHED events.
[2026-02-11 05:36:47] - New feature: Implemented access events full-list flow: API GET /api/access-events with filters+pagination, composition mapping for full event DTO/page metadata, and admin-ui access events page updated with filter form, pagination controls, and map action limited to UNMATCHED rows.

- Access events UX (server-first): first page is loaded server-side with forwarded auth cookies; subsequent filter/page changes update only table area with local skeleton and keep dashboard context visible.
[2026-02-11 05:55:31] - New feature: Enhanced access-events UX: added collapsible filter panel with applied-filters badge, server-first initial load via TanStack Start server function, table-only loading skeleton for client pagination/filter updates, shadcn pagination component integration, and scroll-to-table behavior on page/filter changes.

- Subscription requests manual resolve UX: admins can manually attach person to pending requests (including unprocessed 'new') via dedicated resolve-person action before approve/reject review.
[2026-02-11 06:21:40] - New feature: Implemented subscription request manual resolve flow (resolve-person endpoint wiring in API + admin-ui action panel/form), normalized UX for resolutionStatus='new' as unresolved/needs_person, and added backlog item for queue pagination/filter/sort.
[2026-02-11 06:54:26] - New feature: Implemented broad audit event coverage across core domain/application flows and services, added shared audit enqueue helper, and wired API/Bot/Worker compositions to pass outbox/idGen/actor context for emitting audit events.

- [AdminUI collapsed branding]: Desktop sidebar now swaps full text branding to a compact School icon when collapsed, preserving clear branding in tight navigation mode.
[2026-02-11 18:22:22] - New feature: Implemented Sidebar Collapsed Branding in admin-ui AppShell: full text branding in expanded mode, compact School icon in collapsed mode; added unit test for branding variant helper; validated with admin-ui test/build.


- [AdminUI shadcn sidebar migration]: App shell navigation now runs on shadcn sidebar primitives, unifying desktop collapse and mobile drawer behavior while preserving permission-aware menu rendering.
[2026-02-11 18:34:16] - New feature: Rewrote admin-ui AppShell sidebar to use shadcn Sidebar component primitives. Added components/ui/sidebar.tsx (SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu*), migrated app-shell navigation/branding/collapse/mobile behavior to these primitives while preserving permissions and profile dropdown.


- Subscription request review requester notifications: when admin approves/rejects a request, requester receives a clear Telegram outcome message via outbox delivery.
[2026-02-11 18:42:04] - New feature: Implemented subscription request review Telegram notifications via outbox by enqueueing alert.notification.requested on approve/reject with clear outcome messages; updated review subscription usecase tests accordingly.

[2026-02-11 18:53:19] - New feature: Implemented Profile Telegram Binding: added API/contracts endpoint to unlink Telegram from current admin and updated profile UI to toggle link/unlink actions by tgUserId state.

[2026-02-11 19:13:41] - New feature: Completed Navigation IA in admin-ui: moved sidebar definition to lib/navigation, added titled Main and separate Monitoring groups (Monitoring, Alerts, Settings), removed Profile from sidebar while keeping profile access via header dropdown, and preserved permission-aware visibility.
[2026-02-11 19:30:16] - New feature: Implemented Subscription Requests UI pagination based on existing sorting, added old requests visibility via status filter, and wired server-backed page metadata across contracts/core/infra/api/admin-ui. Added/updated tests and validated targeted checks; remaining failures are unrelated existing blockers.


- Access Events operational list UX: persisted URL-state filters/pagination with SSR-compatible first render, compact row layout, icon-based diagnostics tooltips, and person hover-card details powered by enriched backend DTO.

[2026-02-11 19:55:21] - New feature: Implemented Access Events enhancements: URL-persisted filters/pagination in admin-ui, compact table UX with tooltip diagnostics and person hover card, backend list query refactor with new core query port + infra query adapter exposing real lastError and effective iin/person in DTO, plus contracts update.
[2026-02-11 20:45:13] - New feature: Implemented server-backed pagination for Persons module: contracts now return page metadata, core/infra persons ports/services/repos include count(), API persons list returns persons+page, and admin-ui persons page uses URL-driven filters/pagination with pagination controls. Updated related UI service callsites and added persons service test.


- Audit Logs operations page: AdminUI now provides dedicated /audit-logs with URL-persisted filters, SSR first load, and server-backed pagination over /api/audit-logs including total count and time-range filtering.
[2026-02-11 21:37:14] - New feature: Implemented Audit Logs page with URL-synced filters and server pagination; extended audit logs contracts/core/infra/api with page metadata and from/to datetime filters; added admin-ui route/components/services/server fn and sidebar navigation item; added repo regression tests for date-filtered list + total; updated API test stubs for new response shape.

- Device settings schema compliance: DeviceService validates adapter-provided `deviceSettingsSchema` as JSON Schema draft 2020-12 and validates device `settingsJson` against effective adapter schema on create/update.
[2026-02-12 05:15:20] - New feature: Implemented full JSON Schema draft 2020-12 validation for adapter deviceSettingsSchema and device settingsJson effective validation on device upsert/update in device-service; added tests and ajv dependencies.

- DS identity auto-mapping: /api/identity/find in DeviceService powers worker auto-resolve and admin-driven person identity preview/apply from persons/:id with settingsJson identityQueryMappings.
[2026-02-12 07:57:15] - New feature: Implemented DS-backed identity auto-mapping: new device-service identity find API, worker personResolver via DS, API gateway/persons auto preview+apply endpoints, and admin-ui persons/:id Auto dialog for preview/apply of identities.

- [2026-02-12 23:12:28] - New feature: Adapter registration capabilities schema changed to string[] and standardized across DS, contracts, mock adapter, admin-ui, and tests.

- [2026-02-12 23:48:17] - New feature: Improved AdminUI device upsert UX: scrollable sheet/drawer with sticky actions, larger mobile Add action, and advanced JSON schema renderer supporting nested objects, enum selects, array<string>, map<string,string>, and map<string,object> for device settings (including identityQueryMappings/timePolicy).

- [2026-02-13 00:37:40] - New feature: Updated device adapter HTTP client to support API envelope responses (success/data/error) for /events/backfill and /identity/find, and identity response parsing now uses data.matches[] with first match selection.

[2026-02-17 07:09:32] - New feature: Implemented identity auto-preview by IIN before person creation, added device-scoped auto-find in add-identity flow, and extended DS identity find request with optional deviceId while preserving enriched match contract.

[2026-02-17 08:02:46] - New feature: Completed Persons table linkage-status UX and shared Person Hover Card reuse: list API now returns hasDeviceIdentities for current page persons, persons table shows Linked/Not linked instead of terminal id, and shared PersonHoverCard is reused in Access Events and Subscription Requests with Open profile action.

[2026-02-17 08:20:45] - New feature: Implemented Tables & Lists UX standardization for Device Operations module: added filter/sort/page-size controls and pagination to Devices registry list, Adapters operations list, and both DS Monitoring tables (adapters/devices), with shared pagination component.

- AdminUI breadcrumb navigation: app shell header now renders route-aware breadcrumbs (with dashboard/profile special cases and safe fallback text) to improve orientation in deep pages.
[2026-02-17 08:51:32] - New feature: Added breadcrumb navigation in admin-ui shell header with route-aware labels and fallback behavior; verified admin-ui production build succeeds.

- Admin account security UX: Telegram OTP login now uses dedicated OTP input interactions, admin password reset results include full reset URL for sharing, and profile supports authenticated self-service password change with current-password verification.
[2026-02-17 09:39:15] - New feature: Implemented Auth UI OTP input for Telegram login, added reset URL display in Admins password reset UX, and introduced authenticated self-service password change flow (current+new) with backend endpoints and profile form.

[2026-02-17 10:45:26] - New feature: Implemented notification freshness controls with per-type max age runtime settings, worker stale-skip behavior, and audit logging for stale notification suppression.

[2026-02-17 20:48:25] - New feature: Implemented Admin UI i18n foundation with react-i18next (RU/EN), language detection + persistence, language switchers in app shell and settings, localized navigation/breadcrumb shell strings, localized fallback routes/pages, localized auth error mapping, and locale-aware date/time formatting helpers adopted by major format modules.

[2026-02-17 22:11:36] - New feature: Admin UI i18n expansion: localized access-events, subscription-requests, and device-monitoring modules with enum label helpers, interpolation/plural keys, and validated build/tests.
