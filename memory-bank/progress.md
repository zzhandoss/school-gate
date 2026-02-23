# Progress

This file tracks the project's progress using a task list format.
2026-01-25 21:52:45 - Log of updates made.

## Completed Tasks

- [2026-02-23 10:21:16] - 🐛 Bug fix completed: Resolved GitHub Actions Linux CI failure caused by blocked native build for better-sqlite3 in pnpm workspace policy. Updated pnpm-workspace.yaml to allow better-sqlite3 and argon2 build scripts in onlyBuiltDependencies, removed ignoredBuiltDependencies entry for better-sqlite3, validated with local lint/typecheck/test/build, pushed commit 34233f5, and verified CI job `verify` succeeded for run 22293919740.

- [2026-02-17 22:11:36] - ✅ Completed: Admin UI i18n expansion: localized access-events, subscription-requests, and device-monitoring modules with enum label helpers, interpolation/plural keys, and validated build/tests.

- [2026-02-17 20:48:25] - ✅ Completed: Implemented Admin UI i18n foundation with react-i18next (RU/EN), language detection + persistence, language switchers in app shell and settings, localized navigation/breadcrumb shell strings, localized fallback routes/pages, localized auth error mapping, and locale-aware date/time formatting helpers adopted by major format modules.

- [2026-02-17 10:45:26] - ✅ Completed: Implemented notification freshness controls with per-type max age settings (parent/alert), stale skip behavior with audit logging, admin/runtime settings exposure, and tests for stale handling and settings snapshots.

- [2026-02-17 09:59:22] - 🐛 Bug fix completed: Cleared backlog entries from memory-bank/TODO.md by user request and fixed failing API/usecase tests by aligning test modules with current auth/runtime settings contracts.

- [2026-02-11 20:45:13] - ? Completed: Implemented server-backed pagination for Persons module: contracts now return page metadata, core/infra persons ports/services/repos include count(), API persons list returns persons+page, and admin-ui persons page uses URL-driven filters/pagination with pagination controls. Updated related UI service callsites and added persons service test.

- [2026-02-11 19:30:16] - ? Completed: Implemented Subscription Requests UI pagination based on existing sorting, added old requests visibility via status filter, and wired server-backed page metadata across contracts/core/infra/api/admin-ui. Added and updated tests; targeted checks passed with known unrelated blockers in API build (adminAuth route type mismatch) and @school-gate/core usecase subpath exports in test env.

- [2026-02-11 06:54:26] - ? Completed: Implemented broad audit event coverage across core domain/application flows and services, added shared audit enqueue helper, and wired API/Bot/Worker compositions to pass outbox/idGen/actor context for emitting audit events.

- [2026-02-11 05:25:42] - ? Completed: Added apps/worker `dev` script to run preprocess, access-events, outbox, and monitoring concurrently without retention.
- [2026-02-11 05:16:24] - ? Completed: Refactored admin-ui dashboard permission behavior: dashboard route remains available to authenticated users, while monitoring and subscription request widgets load/render independently by permissions with per-widget error handling and empty-state when no widgets are available.
- [2026-02-11 05:07:07] - ?? Bug fix completed: Fixed DS monitoring adapter name propagation: added instanceKey/instanceName to monitoring contracts and updated API monitoring mapping fallback so adapter identity fields are preserved through /api/ds/monitoring and /api/monitoring snapshots.
- [2026-02-11 04:58:12] - ? Completed: Enhanced admin invite creation UX in admin-ui: added separate copy actions for invite code and full invite URL (/invite?token=...), with generated absolute link based on current origin for immediate sharing.
- [2026-02-10 20:43:02] - ? Completed: Implemented admin-ui Device Operations UI in apps/admin-ui with protected routes (/devices, /devices/adapters, /devices/monitoring), sidebar navigation updates, DS API service/types for /api/ds/*, permission-aware devices CRUD (sheet/drawer create-edit, enable/disable switch, delete confirmation), adapters operational read-only view, monitoring overview/tables/outbox block, tests for DS service, and ran lint/test/build successfully.
- [2026-02-10 06:07:53] - ? Completed: Implemented backend update-my-profile flow for admin auth: added PATCH /api/auth/me contract + route + feature wiring, added AdminsService/AdminsRepo setProfile with email uniqueness check, implemented Drizzle setProfile update, and updated auth API tests/stubs.
- [2026-02-10 05:55:48] - ? Completed: Extended API auth session payload: GET /api/auth/session now returns admin plus roleId, roleName, and permissions for frontend authorization rendering. Updated contracts/session schema, auth feature mapping, and test stubs/scenarios to match new response shape.
- [2026-02-10 00:37:42] - ?? Bug fix completed: Auth module stabilization in apps/api: removed debug token console output, fixed refresh endpoint body parsing to avoid 'TypeError: unusable' on JSON requests and support cookie-only refresh when body is absent, and expanded local CORS defaults to include localhost:3000 and localhost:5000 (plus existing bot/device origins in .env.example) to avoid local auth cookie flow breaks due origin mismatch.
- [2026-02-09 23:38:38] - ? Completed: Implemented hybrid admin auth with bearer-first and HttpOnly cookie fallback; added /api/auth/session and /api/auth/logout; login/refresh now set auth cookies; CORS credentials enabled with explicit origin whitelist defaults updated to localhost:5000; added auth cookie config in env; added API tests for cookie/session/logout and updated root RUN_SERVICES.md runbook.
- [2026-02-09 22:45:58] - ? Completed: Updated `apps/bot` logging mode to stdout in development (`NODE_ENV=development|dev`) and kept rotating file logger for non-dev; updated bot `dev` script to set `NODE_ENV=development`.
- [2026-02-09 22:39:07] - ? Completed: Unified bot notification delivery contract to `tgUserId` end-to-end (worker -> bot API -> Telegram adapter), updated bot/worker payload schemas and sender/client logic, refreshed bot API test payloads, and fixed outbox worker test import to `createOutbox`.
- [2026-02-09 22:36:30] - Completed: Добавлен root runbook RUN_SERVICES.md с порядком запуска сервисов, параллельным запуском, минимальным и полным сценариями, командами dev/prod и bootstrap первого админа.
- [2026-02-09 22:27:46] - ? Completed: Добавлен backend-only first-admin bootstrap: новый endpoint POST /api/auth/bootstrap/first-admin, IAM flow createFirstAdmin с автосозданием роли super_admin и выдачей первого active admin, плюс контракты/ошибки/документация и API тесты bootstrap+login.
- [2026-02-09 22:13:42] - ? Completed: Implemented invite registration UI flow in apps/admin-ui using shadcn + best practices. Added public /invite route with token query handling and missing-token fallback state; updated root auth guard allowlist to include /invite. Added react-query provider and query client setup, invite form built with react-hook-form + zod resolver, password confirmation validation, and mutation-based submit flow. Extended auth service with acceptInvite and acceptInviteAndLogin (auto-login after invite acceptance). Added centralized auth error mapping and updated login screen to reuse friendly error messages and link to invite registration. Added unit tests for auth error mapping and invite schema validation.
- [2026-02-09 21:54:12] - ? Completed: Implemented Telegram bot MVP foundation in apps/bot with Telegraf long polling, parent menu flows (new subscription request, my subscriptions, help), inline toggle actions, and integration with core/infra subscriptions flows. Added core/infra support for parent-owned subscription status change flow and listing subscription requests by tgUserId, plus targeted tests for bot helpers, repos, and new flow.
- [2026-02-09 21:24:27] - ?? Bug fix completed: Hardened admin-ui route protection so unauthorized users cannot access dashboard even on direct URL entry. Root route guard no longer skips server-side check for protected paths; non-public routes now always require active session and redirect to /login otherwise.
- [2026-02-09 21:14:08] - ?? Bug fix completed: Исправлен CORS в apps/api и apps/device-service: whitelist origin из env с дефолтом localhost:3000, подключён CORS middleware для браузерных маршрутов, добавлены тесты preflight для API и device-service.
- [2026-02-09 20:38:30] - ? Completed: Enhanced admin-ui reliability and routing behavior. Added configurable backend base URL via VITE_API_BASE_URL with default http://localhost:3000 and .env.example. Hardened route access by adding global auth gate in root route (only /login and /unavailable are public), keeping dashboard guarded for unauthenticated redirects. Implemented fallback pages: global not-found page, global error page, and dedicated /unavailable page. Added network failure handling in API client (server_unreachable) and automatic redirect to /unavailable from login/dashboard when backend is unreachable.
- [2026-02-09 20:16:27] - ? Completed: Improved `apps/device-service` delivery internals by extending OpenAPI route helper with `body/query/params/headers` support and introducing centralized error mapping (`mapErrorToFailure` + `domainErrorRegistry`) in HTTP app `onError`.
- [2026-02-09 20:13:26] - ?? Bug fix completed: Adjusted admin-ui root route behavior: `/` now always redirects to `/dashboard`. Access control remains in `/dashboard` guard, so unauthenticated users are redirected to `/login` while authenticated users land on dashboard by default.
- [2026-02-09 19:51:58] - ? Completed: Implemented Admin UI iteration 1 in apps/admin-ui: replaced starter root flow with real auth+dashboard experience. Added /login and /dashboard routes with auth guards and redirect logic from /. Built shadcn-style UI primitives and pages based on login-04 and a lightweight dashboard-01 shell. Implemented API client with envelope parsing, bearer auth, single-flight refresh retry on 401, session storage in memory+localStorage, and auth service (login/refresh/logout). Wired dashboard to live data from /api/monitoring and /api/subscription-requests. Added lint ignores for build artifacts/config files and added unit tests for envelope parsing so app tests run.
- [2026-02-09 19:49:10] - ? Completed: Refactored `apps/device-service` API architecture to thin-handler delivery: added `delivery/http` with composable middleware (`parseBody`, bearer/admin auth, response schema), introduced composition features for adapters/devices/monitoring business shaping, integrated OpenAPI + Scalar endpoints (`/openapi.json`, `/docs`) with security schemes, added `/api/*` admin routes with `/admin/*` compatibility aliases, and kept legacy import compatibility wrappers.
- [2026-02-09 19:35:24] - ? Completed: Kickoff research for Admin UI: reviewed docs/specs, API delivery wiring, and contracts; confirmed `apps/admin-ui` is currently starter scaffold with demo routes and no production API client; verified active backend admin route prefix is `/api/*` and identified integration sources (`/openapi.json`, `/docs`, `packages/contracts`).
- [2026-02-09 06:03:26] - ? Completed: Renamed API route prefix from /admin/* to /api/* for admin endpoints and switched apps/api logger to console stdout in development mode while keeping file logging for non-dev.
- [2026-02-09 05:48:58] - ?? Bug fix completed: Fixed /openapi.json runtime 500 in apps/api caused by zod-openapi parameter metadata incompatibility; switched OpenAPI generation to stable custom route and limited request schema docs to JSON body to avoid inline parameter generation crash.
- [2026-02-09 05:30:26] - ? Completed: Integrated OpenAPI + Scalar into apps/api: switched delivery routes to OpenAPIHono with documented route declarations, added /openapi.json and /docs endpoints, and centralized route OpenAPI envelope/error response helper.
- [2026-02-09 04:48:19] - ?? Bug fix completed: Fixed core ESM circular initialization causing apps/api startup crash: DomainError moved to dedicated module to break cycle with InvalidSettingValueError.
- [2026-02-09 00:47:22] - ? Completed: Finalized `apps/api` delivery DX: replaced `createRoute` with `handler(({ c, body, query, params }) => ...)`, introduced `useResponse` and `useErrorMap` middleware, removed `getParsedInput` usage, switched route dependency alias from `handlers` to `module`, migrated all route modules, and updated API composition wiring.
- [2026-02-08 22:17:28] - ? Completed: Simplified `apps/api` delivery DX: removed presenters, updated `createRoute` to apply response schema + success envelope, moved DTO shaping to composition features (`auth`, `subscriptions`), and kept handler bodies method-only with middleware-validated input.
- [2026-02-08 21:41:40] - ? Completed: Implemented cleaner `apps/api` handler composition by adding route DSL (`createRoute`), centralized HttpError mapping in `createHttpApp`, query parsing middleware, presenters for response shaping, and migrating `adminAuth` + `subscriptionRequests` routes away from local `try/catch`.
- [2026-02-08 19:27:57] - ? Completed: Rebuilt `apps/api` into explicit layers (`runtime`, `composition/features`, `delivery/http`), migrated all API imports to root `@school-gate/core` and `@school-gate/infra` exports, removed legacy `src/app/modules` scaffold and monolithic entry wiring, and restored `pnpm --filter @school-gate/api build`.
- [2026-02-07 04:10:59] - ? Completed: Aligned transaction boundaries across core/infra: added `withTx` to all core repo/service contracts, implemented `withTx` in core service factories via repo rebinding, added `withTx` implementations to infra drizzle repos, and added `SubscriptionsService.setActiveByIdSync` for sync method parity.
- [2026-02-07 02:36:45] - ? Completed: Created barrel exports for infra package: added index.ts files in src root and nested directories (config, drizzle, drizzle/repos, drizzle/queries, logging, ops, security), re-exported infra modules through these indexes, and extended `packages/infra/package.json` exports with root and directory index entrypoints.
- [2026-02-06 23:41:46] - ? Completed: Implemented package-only xBC split for subscriptions admin list: added core query models and subscriptions query port, added listSubscriptionsAdmin usecase in core, moved SQL projection into infra drizzle query adapter, removed listForAdmin from subscriptions repo, and added infra export for drizzle queries.
- [2026-02-05 20:38:12] - ? Completed: Added alerts module documentation at docs/core/alerts.md and linked it from docs/core/README.md.
- [2026-02-04 03:21:30] - ? Completed: Added createTelegramLoginCode flow (linking to admin tg codes with purpose=login) and exported it from IAM index. No migrations touched per rule.
- [2026-02-04 02:27:09] - ? Completed: Implemented IAM auth scaffolding: added auth service with JWT issuance and refresh rotation; added auth strategies (email/password, telegram code); added refresh tokens entity/repo/service and ports for jwtSigner and refreshTokenHasher; added refresh token errors; added refresh_tokens DB table and migration; moved password reset flows to flows/password-reset and updated exports; removed adminLogin flow and searchPersonsByIin/listPending flows per single-service rule. Updated IAM index and core package exports.
- [2026-01-30 23:38:39] - ? Completed: Implemented alerts backend (rules/subscriptions/events, evaluation, Telegram outbox), added DB schema/migration, API routes/contracts, monitoring worker integration, tests, and updated NotificationSender; added new errors. Noted new coding rules: optional fields require | undefined and schema imports without /index. No default alert rule seeding yet.
- [2026-01-30 21:21:56] - Completed: Implemented monitoring snapshots storage + history endpoint, monitoring worker, DS internal monitoring wiring, and updated contracts/tests/env. Added monitoring snapshots schema/migration, repo/usecases, API list snapshots endpoint and tests; wired components provider with bot auth headers and DS monitoring client; updated device-service internal monitoring wiring and tests; added monitoring worker and scripts; updated .env.example for logging/monitoring/device service envs.
- [2026-01-30 17:04:46] - ? Completed: Wired admin roles/permissions list endpoints, admin subscriptions and audit logs APIs, plus tests and docs. Added API composition root wiring for new usecases, subscriptions/audit logs handlers, and list roles/permissions handlers; added stubs and new API tests; documented new endpoints.
- [2026-01-30 01:56:39] - ? Completed: Added Telegram notification delivery via bot service with internal HTTP API, mustache template runtime setting, and outbox pre-claim bot health check; introduced bot and notifications env configs, runtime settings keys/snapshot updates, tests, and docs.
- [2026-01-30 00:37:59] - ? Completed: Added admin management endpoints (list admins, update status/role, admin-triggered password reset link), new core usecases and contracts; JWT payload now includes permissions. DeviceService admin routes now require JWT permissions (devices.read/write) with new admin auth middleware and config. Added admin management API docs and updated device-service spec; updated tests to include admin auth and new admins API tests.
- [2026-01-29 22:00:36] - Completed: Documented admin auth endpoints and payloads in docs/specs/admin-auth.md (login, invites, password resets, telegram link, roles, permissions, errors).
- [2026-01-29 21:25:48] - ? Completed: Stage 3 admin auth: JWT auth middleware with permissions guard, admin auth/roles routes, new contracts for auth DTOs, API composition root wiring with jose JWT, role name duplication guard, new admin auth API tests, and admin route permission enforcement. Added helper for test stubs.
- [2026-01-29 20:06:59] - ? Completed: Stage 2 auth base: added admin invites/password resets/tg links schema, core repos+usecases for invites/login/reset/tg link, roles repo, argon2 password hasher + token hasher in infra, and tests for roles/invites/reset/tg link.
- [2026-01-29 19:45:45] - ? Completed: Stage 1 auth groundwork: added admin/roles schema, core permission list + preset roles, and tests for preset validity; exported new admin schema and core auth exports.
- [2026-01-29 17:42:28] - ? Completed: Expanded DeviceService admin devices endpoints (GET by id, PATCH partial update, DELETE) and added admin adapters list endpoint. Added new device usecases (get/update/delete), repo delete method, adapters contracts, and tests for new routes.
- [2026-01-28 23:22:11] - ??? Architecture change completed: Moved device registry from Core to DeviceService; removed Core /admin/devices and device checks; added DS admin devices API and Hono server; updated device DB schema (name) and tests.
- [2026-01-28 21:52:55] - ?? Refactor completed: Removed runAll runner and replaced with per-entrypoint dev/start scripts plus concurrently-driven dev:all/start:all for workers and device-service; added adapter dev:all/start:all aliases; updated root scripts.
- [2026-01-28 18:34:13] - ?? Bug fix completed: Prevent app builds from pulling workspace source files into compilation (rootDir errors) by overriding baseUrl/paths in app tsconfigs to empty mapping and setting moduleResolution to NodeNext; disables declaration output for apps.
- [2026-01-28 14:22:34] - ?? Bug fix completed: Fix infra UnitOfWork typing by removing explicit Db annotation in transaction callback (matches drizzle transaction type).
- [2026-01-28 13:55:15] - ?? Bug fix completed: Fix @school-gate module resolution in apps/tests by switching vitest alias to prefix string mapping and extending app tsconfigs from tsconfig.base.json to inherit paths (NodeNext overrides, rootDir/outDir).
- [2026-01-28 13:38:37] - ?? Bug fix completed: Fix test DB migration helper to use packages/db/src/migrations path (actual location).
- [2026-01-28 13:37:10] - ?? Bug fix completed: Fix test DB migrations path to point to packages/db/migrations relative to test helpers (avoid alias-resolved path).
- [2026-01-28 13:35:35] - ?? Bug fix completed: Fix vitest config alias regex parse error by switching alias find patterns to RegExp constructor.
- [2026-01-28 13:22:22] - ?? Bug fix completed: Fix test runtime module resolution by adding @school-gate/* aliases in vitest config (maps to packages/*/src) so workspace imports resolve without root node_modules.
- [2026-01-28 12:36:03] - ?? Bug fix completed: Fix device package build resolution in monorepo: move device subproject outDir to packages/device/dist to match package exports, add tsBuildInfoFile paths, add project references in device/infra tsconfig, and add explicit repo method typings to remove implicit any; adjust device unitOfWork tx typing.
- [2026-01-28 10:40:01] - ? Completed: Added mock adapter service under apps/adapters/mock with SQLite raw-events store, DeviceService client, backfill HTTP server, runtime loops (register/heartbeat/push/backfill/generate), plus adapter config in packages/config and env example updates. Added adapter events repo tests and updated workspace globs.
- [2026-01-28 09:22:53] - ? Completed: DeviceService adapter backfill runner: added adapter HTTP client for fetchEvents, backfill runner triggered on register/heartbeat, and DS adapter API contracts/tests for assignments/backfill runner.
- [2026-01-28 01:05:12] - ? Completed: DeviceService adapter API contracts: added adapter registry, register/heartbeat/events endpoints (HTTP server), assignments usecase, and device service config/env keys.
- [2026-01-28 00:49:48] - ? Completed: DeviceService reliability: added device cursors table+repo, backfill usecase, and cursor advancement on Core ack in device outbox processor; updated device outbox worker and tests.
- [2026-01-27 22:47:35] - ? Completed: Monitoring v2: added monitoring worker TTL runtime setting, computed worker status (ok/stale) with ttl in monitoring snapshot, updated contracts/routes/tests and config/.env.
- [2026-01-27 22:24:15] - ?? Bug fix completed: Fix monitoring repo toDate to handle numeric aggregate timestamps (unix seconds) to avoid Invalid Date -> 500 in /admin/monitoring.
- [2026-01-27 21:28:29] - ? Completed: Prod-like monitoring: added worker heartbeats schema+ports+repo, wired heartbeats into workers and retention run-once, and extended /admin/monitoring contracts/routes/tests with workers and top errors.
- [2026-01-27 20:51:16] - ? Completed: Added admin monitoring snapshot: core monitoring port and getMonitoringSnapshot usecase, Drizzle monitoring repo aggregating access events and outbox counts + lag markers, monitoring contracts and /admin/monitoring route, API wiring, updated DI stubs in API tests, and added monitoring API test. Typecheck passes.
- [2026-01-27 20:31:19] - ? Completed: Added retention lifecycle admin endpoints: extended retention ops service with runRetentionOnce and removeRetentionSchedule, added /admin/retention/run-once and /admin/retention/schedule/remove routes and contracts, updated API composition root and retention CLI scripts, and updated API DI stubs/tests. Typecheck passes.
- [2026-01-27 20:17:02] - ? Completed: Added admin retention schedule apply endpoint by extracting schedule logic into infra service, wiring /admin/retention/schedule/apply in API, adding retention admin contracts, updating API test DI stubs, and adding a retention schedule API test. Typecheck passes.
- [2026-01-27 20:00:28] - ? Completed: Added user-level scheduled retention support: retention run-once and apply-schedule scripts, OS-aware scheduling via schtasks/crontab, retention runtime settings/env keys integrated into core snapshot/set/get and API contracts, retention cleanup UC + repos + tests, and retention removed from runAll default entries with new scripts.
- [2026-01-27 19:41:55] - ? Completed: Added retention cleanup: runtime settings and env config for retention, core cleanupRetention usecase, retention repos, retention worker entrypoint wired into runAll, and retention UC tests.
- [2026-01-27 19:21:08] - ? Completed: Added admin API for subscription requests: contracts, routes, wiring in API composition root, updated DI stubs in existing API tests, and added subscription requests API tests. Typecheck passes.
- [2026-01-27 18:34:29] - ? Completed: Standardized API response format to { success, data?, error? }: added contracts for api error/success, introduced response helpers, updated middleware/auth/onError and all admin/ingest routes to wrap responses and errors with codes/messages/data, updated device HTTP client error parsing to handle new format, and updated API tests to assert the new response envelope plus added missing behavior tests.
- [2026-01-27 18:12:26] - Completed: Expanded API test coverage for missing behaviors: access events now test expired timestamps (401), disabled device rejection (403), and batch ingestion; devices API now tests 404 on enabling missing device; access-events admin API now tests person-not-found (404) and mapping conflict (409); persons API now tests invalid iin query validation (400).
- [2026-01-27 18:04:57] - ? Completed: Added admin persons search API with exact-or-prefix behavior: extended PersonsRepo with searchByIinPrefix, implemented prefix search in drizzle repo, added createSearchPersonsByIinUC (exact for 12 digits else prefix), added contracts and /admin/persons route, wired it in API composition root, updated existing API tests for new DI, and added persons API tests.
- [2026-01-27 17:56:20] - ? Completed: Added admin unmatched access events API: contracts for unmatched list and terminal identity mapping, new routes /admin/access-events/unmatched and /admin/access-events/mappings, wired createListUnmatchedAccessEventsUC and createMapPersonTerminalIdentityUC in API composition root, updated existing API tests to provide new handlers, and added new admin API tests for unmatched listing and mapping requeue.
- [2026-01-27 17:45:33] - ?? Bug fix completed: Made migration 0013_real_maginty a no-op to avoid duplicate devices.enabled ADD COLUMN after db:generate, aligning migrations with existing snapshot history without deleting files.
- [2026-01-27 17:36:39] - ?? Bug fix completed: Switched drizzle.config.ts to canonical dotenv/config approach (dotenv installed by user), removing local env loader while keeping sqlite file: normalization and absolute path resolution.
- [2026-01-27 17:27:35] - ?? Bug fix completed: Made drizzle-kit migrations runnable under ESM monorepo by removing packages/config imports from drizzle.config.ts, adding a small local .env loader and sqlite url normalization, and ensuring migration 0012_devices_enabled is in migrations meta journal.
- [2026-01-27 17:20:21] - ?? Bug fix completed: Made drizzle migrations runnable under ESM monorepo by changing drizzle.config.ts import to .ts extension and adding 0012_devices_enabled to migrations meta journal.
- [2026-01-27 17:18:34] - ?? Bug fix completed: Fixed drizzle-kit config import resolution by changing drizzle.config.ts to import packages/config index via .ts extension instead of .js under ESM monorepo setup.
- [2026-01-27 17:09:01] - ? Completed: Implemented strict devices registry in Core: added devices.enabled column and migration, expanded core DevicesRepo, added devices usecases (list/upsert/setEnabled), added drizzle devices repo, added admin routes /admin/devices, enforced device registration+enabled checks in ingestAccessEvent, mapped domain errors in accessEvents routes, and updated API/UC tests.
- [2026-01-27 16:41:42] - ? Completed: Implemented Core ingestion API with HMAC auth: added access events contracts and routes (/api/events, /api/events/batch), verifyIngestAuth middleware using bearer+HMAC, API wiring with ingest UC and inline queue, device HTTP client signing, updated .env.example and device service config, and added API ingestion tests.
- [2026-01-27 15:20:38] - ?? Bug fix completed: Minimal monorepo module-system fix: added "type": "module" to packages/core, infra, db, device, and test package.json to align with apps/api NodeNext + verbatimModuleSyntax.
- [2026-01-25 21:57:56] - Completed: Initialized and filled Memory Bank core files with project context, active context, progress, decision log, and system patterns; completed Serena onboarding memories (project overview, commands, style, task completion).
- [2026-01-25 22:03:10] - Completed: Updated project idea in Memory Bank and added a combined worker dev runner using tsx.
- [2026-01-25 22:11:11] - Completed: Added combined worker dev runner (runAll.ts), added pnpm dev script and tsx dev dependency; updated Memory Bank with project idea and decisions.
- [2026-01-25 22:15:57] - Completed: Refactored worker runner to be testable, added runAll tests, ran checks (lint failed due to existing repo issues; typecheck/build ok; tests failed with esbuild spawn EPERM).
- [2026-01-26 00:02:46] - Completed: Added sync UnitOfWork with transactional review and outbox enqueue; added outbox lease reclaim, audit dedup, migration, and tests.
- [2026-01-26 12:24:49] - Completed: Added ideas bank at memory-bank/ideas.md and recorded initial future idea about trusted persons viewing other subscribers.
- [2026-01-26 15:52:58] - Completed: Implemented core access event ingestion and unknown-event admin flow using existing personTerminalIdentities and accessEvents; added new usecases, repo methods, errors, and tests. Added listUnmatched UC, mapping UC with conflict checks and requeue of unmatched events. Added personsRepo.getById.
- [2026-01-26 16:27:21] - Completed: Added access events processing pipeline: access_events now store direction; new processAccessEvents usecase enqueues parent notification events via outbox and marks events processed; new access-events worker and config; notification outbox handler with console sender; added tests. Updated runAll to include access events worker.
- [2026-01-26 17:32:12] - Completed: Added access-events lease/claim with maxAttempts and error state; added processing_by/at and last_error columns, new PROCESSING/ERROR statuses; added inline access-event queue + process-by-id usecase; updated workers/config, outbox notification plumbing, and tests.
- [2026-01-26 19:01:25] - Completed: Drafted Device Service contract in docs/specs/device-service.md with event schema, idempotency, retry semantics, and open decisions for timestamps, endpoints, and auth.
- [2026-01-26 19:59:32] - Completed: Restructured repo into monorepo layout (apps/worker, packages/core/infra/db/test) and updated scripts/config/imports; added apps/device-service placeholder and workspace config.
- [2026-01-26 21:18:57] - Completed: Added DeviceService internal package (packages/device) with core/infra/device-db, schema+migrations, unit-of-work, repos, usecases, and tests in packages/test/device.
- [2026-01-26 23:33:59] - Completed: Added roadmap at memory-bank/TODO.md and drafted Agent/Relay WebSocket protocol spec in docs/specs/agent-relay-ws.md for cloud Admin Mini App access via on-prem agent.
- [2026-01-27 11:37:03] - ? Completed: Implemented DeviceService transport for HTTP push: added CoreIngestClient port, fetch-based HTTP client, device outbox batch processor usecase, device outbox worker entrypoint and config, root device:dev script, and tests for outbox processing behavior.
- [2026-01-27 12:08:04] - ? Completed: Added packages/config with .env loader + zod validation, created .env.example, wired configs into worker/device-service entrypoints and drizzle configs, and fixed worker outbox import paths.
- [2026-01-27 12:34:22] - ? Completed: Implemented DB-backed runtime settings on top of env config: added settings repo/usecases, extended config overrides, wired workers to load settings from DB, and added runtime settings test.
- [2026-01-27 12:47:23] - ? Completed: Added admin-ready runtime settings snapshot flow: core runtime config types, runtime config provider port+infra adapter, listRuntimeSettingsSnapshot usecase, runtime settings service, and snapshot tests; refactored keys/types into core config module.
- [2026-01-27 13:58:13] - ? Completed: Added Hono API composition root with pino request-context logging, zod contracts package, middleware-based JSON validation, and runtime settings admin routes (GET snapshot + PATCH set); updated api entrypoint and config exports.

## Current Tasks

- Plan terminal event ingestion approach.
- Stabilize Telegram bot parent MVP flow in production-like runtime (private chat policy, state transitions, and error mapping).

## Next Steps

- Continue i18n expansion for remaining AdminUI modules (admins, alerts, auth screens, audit logs, persons, devices list/adapters) and normalize RU copy quality after key coverage.
- Validate audit event payloads in integration tests for high-risk admin and subscription flows.

- Wire admin UI settings for notification templates and bot status.
- Add bot-level integration tests for Telegraf update handling (`handleUpdate`) including callback flows and private-chat guard behavior.

2026-01-25 21:55:41 - Progress initialized for onboarding.






- [2026-02-09 22:28:27] - ? Completed: Admin UI invite onboarding + password reset flows with public routes, shadcn-based forms, react-query integration, auth error mapping reuse, and validation/test coverage.

- [2026-02-09 22:35:26] - ? Completed: Added admin-ui first-admin bootstrap flow (public route + form + API integration + error handling + tests) for initializing empty system via /api/auth/bootstrap/first-admin.

- [2026-02-09 22:48:23] - ? Completed: Refactored admin-ui auth client to cookie-first session model and removed public onboarding CTAs from login.

- [2026-02-09 23:05:55] - ? Completed: Admin UI UX polish across auth/fallback/dashboard routes with improved interactive states and dashboard table redesign.

- [2026-02-09 23:32:19] - ? Completed: Applied web-design-guidelines compliance fixes in admin-ui across accessibility, typography, and interaction details.
- [2026-02-09 23:38:06] - ? Completed: Implemented admin Telegram linking and dual-mode Parent/Admin UX in apps/bot using Telegraf with `/link <code>`, mode switch buttons, admin menu placeholder, and composition wiring to IAM link flow + admin access by `tgUserId`. Added bot tests for `/link` command parsing and menu rendering.

- [2026-02-09 23:49:30] - ?? Bug fix completed: Fixed admin-ui logout-on-refresh issue by enabling dev-safe auth cookie config (API_AUTH_COOKIE_SECURE=false) and adding cookie-based refresh fallback in session resolution (/api/auth/refresh -> /api/auth/session retry).
- [2026-02-10 04:20:40] - ?? Bug fix completed: Added backend auth cookie trace logs for /api/auth/session and /api/auth/refresh to diagnose missing Cookie header and cookie parsing on API side; kept logs non-sensitive and dev-only.
- [2026-02-10 05:18:49] - ?? Bug fix completed: Fixed admin-ui SSR auth check to stop server-side /session and /refresh calls without browser cookies by skipping root auth guard on server runtime; auth checks now run in browser guards where credentials include works with HttpOnly cookies.
- [2026-02-10 05:31:35] - ? Completed: Reworked admin-ui auth flow to TanStack Start server-function session model with forwarded HttpOnly cookies, root context hydration, and centralized route gating.
- [2026-02-10 05:38:19] - ?? Bug fix completed: Fixed delayed logout in admin-ui by making logout server-confirmed and awaited. Added logoutServerFn that forwards HttpOnly cookies to backend /api/auth/logout and forwards Set-Cookie back. App shell now awaits logout before navigation and invalidates router state.
- [2026-02-10 05:51:29] - ? Completed: Enhanced admin-ui shell UX: added header profile section with avatar and custom dropdown (settings/profile soon, role text, sign out), and implemented desktop-collapsible sidebar while preserving mobile drawer behavior.
- [2026-02-10 05:58:21] - ? Completed: Admin UI account UX iteration: removed Settings item from profile dropdown, added protected /profile route with profile editing form and Telegram link-code generation flow, wired app-shell navigation to profile, and kept sign-out in dropdown. Profile save now targets PATCH /api/admins/me (shows explicit guidance if endpoint is missing).
- [2026-02-10 06:04:15] - ? Completed: Updated admin-ui session model to support roleName and permissions from /api/auth/session and switched role display from roleId to roleName (with roleId fallback) in app shell and profile page.

- [2026-02-10 06:55:32] - Completed: Added admin-ui Alerts page as separate route with shadcn-based production UI, sidebar navigation entry, and integrated rules/events/subscriptions APIs with per-admin notification toggles.
- [2026-02-10 07:15:40] - Completed: Implemented alert rule creation UX in admin-ui with responsive Sheet/Drawer Create Rule flow and dynamic config form wired to /api/alerts/rules.
- [2026-02-10 19:20:00] - Completed: Implemented Edit Rule (Sheet/Drawer) and replaced Subscribe button with Switch in alerts rules table.

- [2026-02-10 19:54:00] - вњ… Completed: Refactored admin-ui runtime settings page from section cards list to shadcn Tabs with per-tab lazy loading and section-scoped refresh/save flow.



- [2026-02-10 20:46:31] - ? Completed: Implemented apps/api device-service gateway endpoints under /api/ds with composition feature forwarding to device-service, auth permission guards, upstream error mapping, runtime wiring reuse, and focused API tests for gateway happy/error cases.

- [2026-02-10 20:50:24] - вњ… Completed: Implemented device-service integration end-to-end: backend gateway routes under /api/ds/* in apps/api and new admin-ui Device Operations module (devices, adapters, monitoring) with shadcn UX and permissions-aware actions.

- [2026-02-10 22:27:54] - ? Completed: Implemented admin management module in admin-ui with protected routes (/admins, /admins/roles), permission-gated sidebar navigation, invite creation via Sheet/Drawer, admins table with status/role updates and password reset token generation, and roles page for create/edit permission assignment using shadcn components. Ran lint/test/build successfully.
- [2026-02-10 22:27:54] - Next: verify invite/reset token UX against backend policy and add safeguards for role changes (self-role and last-super-admin constraints).

- [2026-02-10 23:26:36] - ? Completed: Added admin-management safety guards in admin-ui: blocked self role changes and blocked disabling the last active super_admin, with corresponding disabled controls and helper hints in admins table. Verified via lint and tests.

- [2026-02-11 00:22:08] - ? Completed: Extended admin invite creation flow in admin-ui to support role source selection: use existing role or create a new role inline with permissions and immediately issue invite. Wired permissions loading into admins page and passed to invite panel/form. Verified with lint and tests.

- [2026-02-11 00:40:17] - ? Completed: Added role permission presets to admin invite new-role flow in admin-ui: Viewer, Operator, Admin one-click presets with manual fine-tuning retained. Verified by lint and tests.

- [2026-02-11 01:22:30] - ? Completed: Implemented admin-ui Subscription Requests module: new route /subscription-requests, sidebar navigation entry (permission-aware), API service for list/review calls, table-based review UI with filters (only/order), approve/reject actions using adminTgUserId, and graceful unavailable/error/access handling. Refactored into small files to keep under line limits. Verified with lint/test/build and routeTree generation.

- [2026-02-11 01:49:55] - ? Completed: Implemented admin-ui Access Events module: added /access-events route, permission-aware sidebar navigation entry, unmatched events data service, terminal identity mapping flow with Sheet/Drawer form, inline person search by IIN via /api/persons, and graceful error/unavailable handling. Added split components to keep files under line limit and verified lint/test/build.

* [2026-02-11 03:15:53] - ? Completed: Implemented Telegram OTP auth flow (email -> code to linked Telegram -> verify code) across API/contracts/core and admin-ui login UI with cookie session continuation, plus tests and error mappings.

* [2026-02-11 04:21:14] - ? Completed: Implemented full persons management in admin-ui and api: persons list/create/update/details pages with device-scoped identities CRUD. Extended contracts/core/infra/api persons layers and integrated navigation and permission-gated flows.
- [2026-02-11 04:21:14] - Next: wire persons permissions to role presets if separate identity-write permission is needed later.





- [2026-02-11 05:36:47] - ? Completed: Implemented access events full-list flow: API GET /api/access-events with filters+pagination, composition mapping for full event DTO/page metadata, and admin-ui access events page updated with filter form, pagination controls, and map action limited to UNMATCHED rows.

- [2026-02-11 05:55:31] - ? Completed: Enhanced access-events UX: added collapsible filter panel with applied-filters badge, server-first initial load via TanStack Start server function, table-only loading skeleton for client pagination/filter updates, shadcn pagination component integration, and scroll-to-table behavior on page/filter changes.

- [2026-02-11 06:02:14] - Completed: Refreshed memory-bank/TODO.md into a living backlog format: added rules for writing tasks, status policy, completion flow, and module-based backlog entries including Access Events URL query-state persistence.

- [2026-02-11 06:21:40] - ? Completed: Implemented subscription request manual resolve flow (API resolve-person wiring + admin-ui resolve panel/form), normalized UI handling for resolutionStatus='new' as manual-needs-person state, and added backlog item for pagination/filter/sort in subscription requests queue.

- [2026-02-11 18:22:22] - ? Completed: Implemented Sidebar Collapsed Branding in admin-ui AppShell: full text branding in expanded mode, compact School icon in collapsed mode; added unit test for branding variant helper; validated with admin-ui test/build.


- [2026-02-11 18:34:16] - ? Completed: Rewrote admin-ui AppShell sidebar to use shadcn Sidebar component primitives. Added components/ui/sidebar.tsx (SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu*), migrated app-shell navigation/branding/collapse/mobile behavior to these primitives while preserving permissions and profile dropdown.


- [2026-02-11 18:42:04] - вњ… Completed: Implemented subscription request review Telegram notifications via outbox by enqueueing alert.notification.requested on approve/reject with clear outcome messages; updated review subscription usecase tests accordingly.

- [2026-02-11 18:53:19] - вњ… Completed: Implemented Profile Telegram Binding: added API/contracts endpoint to unlink Telegram from current admin and updated profile UI to toggle link/unlink actions by tgUserId state.

- [2026-02-11 19:13:41] - вњ… Completed: Completed Navigation IA in admin-ui: moved sidebar definition to lib/navigation, added titled Main and separate Monitoring groups (Monitoring, Alerts, Settings), removed Profile from sidebar while keeping profile access via header dropdown, and preserved permission-aware visibility.


- [2026-02-11 19:55:21] - ? Completed: Implemented Access Events enhancements: URL-persisted filters/pagination in admin-ui, compact table UX with tooltip diagnostics and person hover card, backend list query refactor with new core query port + infra query adapter exposing real lastError and effective iin/person in DTO, plus contracts update.
- [2026-02-11 19:55:21] - Next: verify Access Events screen behavior in integrated API runtime and decide whether to add popover-based expanded diagnostics for mobile.


- [2026-02-11 21:37:14] - ? Completed: Implemented Audit Logs page with URL-synced filters and server pagination; extended audit logs contracts/core/infra/api with page metadata and from/to datetime filters; added admin-ui route/components/services/server fn and sidebar navigation item; added repo regression tests for date-filtered list + total; updated API test stubs for new response shape.
- [2026-02-11 21:37:14] - Next: Continue with Monitoring standalone page using the same URL-state + server-pagination table pattern.

- [2026-02-12 05:15:20] - ? Completed: Implemented full JSON Schema draft 2020-12 validation for adapter deviceSettingsSchema and device settingsJson effective validation on device upsert/update in device-service; added tests and ajv dependencies.

- [2026-02-12 07:57:15] - ? Completed: Implemented DS-backed identity auto-mapping: new device-service identity find API, worker personResolver via DS, API gateway/persons auto preview+apply endpoints, and admin-ui persons/:id Auto dialog for preview/apply of identities.

- [2026-02-12 23:12:28] - ? Completed: Switched adapter registration capabilities contract from object to string[] across contracts, device-service, mock adapter, admin-ui, and tests; backfill capability check now uses includes('fetchEvents').

- [2026-02-12 23:48:17] - ? Completed: Improved AdminUI device upsert UX: scrollable sheet/drawer with sticky actions, larger mobile Add action, and advanced JSON schema renderer supporting nested objects, enum selects, array<string>, map<string,string>, and map<string,object> for device settings (including identityQueryMappings/timePolicy).

- [2026-02-13 00:37:40] - ? Completed: Updated device adapter HTTP client to support API envelope responses (success/data/error) for /events/backfill and /identity/find, and identity response parsing now uses data.matches[] with first match selection.

- [2026-02-17 07:09:32] - ? Completed: Implemented identity auto-preview by IIN before person creation, added device-scoped auto-find in add-identity flow, and extended DS identity find request with optional deviceId while preserving enriched match contract.

- [2026-02-17 08:02:46] - ? Completed: Completed Persons table linkage-status UX and shared Person Hover Card reuse: list API now returns hasDeviceIdentities for current page persons, persons table shows Linked/Not linked instead of terminal id, and shared PersonHoverCard is reused in Access Events and Subscription Requests with Open profile action.

- [2026-02-17 08:20:45] - ? Completed: Implemented Tables & Lists UX standardization for Device Operations module: added filter/sort/page-size controls and pagination to Devices registry list, Adapters operations list, and both DS Monitoring tables (adapters/devices), with shared pagination component.

- [2026-02-17 08:51:32] - ? Completed: Added breadcrumb navigation in admin-ui app shell header with route-aware labels and fallback text behavior; verified admin-ui build succeeds.

- [2026-02-17 09:39:15] - ? Completed: Implemented Auth UI OTP input for Telegram login, added reset URL display in Admins password reset UX, and introduced authenticated self-service password change flow (current+new) with backend endpoints and profile form.


- [2026-02-23 01:28:59] - Completed: Implemented production-readiness baseline: initialized git with remote, added CI/release workflows (source+prebuilt zip + SHA256SUMS), configured changesets, added cross-platform runbook and ops scripts, and created docs/production-readiness.md tracker with P0/P1 statuses and blockers.

- [2026-02-23 01:33:00] - Completed: Performed first secure push to GitHub remote (main branch tracking origin/main), closing production-readiness tracker item P0-11.

- [2026-02-23 02:22:10] - ✅ Completed: Stabilized workspace typecheck, restored broad test import compatibility, and reduced failing tests by adding legacy compatibility adapters for core usecases and test aliasing; remaining blockers are API/usecase regression failures causing 500s in test suites.

## Next Steps (2026-02-23)
- Diagnose common 500 root causes in API test suites (dmins, subscriptions, monitoring, udit-logs, ccess-events) and restore expected handler contracts.
- Finish compatibility for legacy IAM/admin flows still requiring outbox in tests (cceptAdminInvite, password reset flow path wrappers).
- Re-run pnpm test, then execute release smoke with a fresh tag.

- [2026-02-23 02:35:56] - ✅ Completed: Production-readiness stabilization completed: legacy compatibility regressions fixed, backward-compatible HTTP response normalization added, outbox/tx adapters restored, and lint+typecheck+test+build are green.

## Next Steps (2026-02-23)
- Create and push fresh release tag vX.Y.Z, then verify GitHub Release artifacts (source zip + prebuilt zip + SHA256SUMS).
- Execute ZIP-based deployment smoke checks on Windows/Linux targets and record evidence in runbook/tracker.

- [2026-02-23 01:44:03] - ✅ Completed: Release smoke test passed for tag v1.0.2 with GitHub Release assets: source zip, prebuilt zip, and SHA256SUMS.
- [2026-02-23 01:44:03] - ⚠️ Follow-up: main CI workflow still fails on GitHub at Test step (Linux parity issue) and requires investigation.
