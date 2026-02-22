# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2026-01-25 21:52:45 - Log of updates made.

## Coding Patterns

- TypeScript strict mode (ES2022, ESNext modules, Bundler resolution).
- ESLint with @typescript-eslint and @stylistic: 4-space indent, double quotes, semicolons, no trailing commas.
- Prefer explicit errors over silent fallbacks (see usecases and domain errors).
- Centralized env loading and validation: `packages/config` loads `.env` and validates typed configs with zod; entrypoints call `loadEnv()` before reading config.
- ESM import conventions: all relative imports include a `.js` suffix (even for `.repo`/`.service` sources), and `@school-gate/*` package subpath imports omit `.js`.
- Optional TypeScript fields must be declared as `someParam?: Type | undefined`.
- Schema imports should omit `/index` (use `@school-gate/db/schema`).
- TypeScript config layering: `tsconfig.base.json` contains shared compiler options only (no workspace `paths`). Packages `extends` base and set `rootDir: ./src`, `outDir: ./dist`. Apps `extends` base and override `module: NodeNext`, `moduleResolution: NodeNext`, `baseUrl: "."`, `paths: {}`, `rootDir: ./src`, `outDir: ./dist`, and `declaration: false` to avoid compiling workspace sources into app builds. `packages/device` remains a composite subproject with its own `core/infra/device-db` tsconfigs and `packages/device/tsconfig.json` references only.
- Dev logging pattern: shared `createLogger` uses `pino-pretty` automatically in development when stdout is TTY (override via `LOG_PRETTY=true|false`), while non-dev continues structured JSON/file logging.

## Architectural Patterns

- AdminUI i18n baseline pattern: use `react-i18next` with localStorage + browser-language detection (`school_gate_admin_locale`), keep RU fallback, and expose language switchers in both app-shell profile menu and settings page for fast operator access.
- Notification freshness guard pattern: worker outbox handlers must compute event age from payload timestamp and runtime-configured max age (`notifications.parentMaxAgeMs` / `notifications.alertMaxAgeMs`), skip stale sends, and emit auditable `notification_skipped_stale` events.
- AdminUI persons pagination pattern: keep persons list state in route search (`limit`, `offset`, `iin`, `query`), request backend `page.total`, and drive pagination controls from server metadata instead of client-side full-list loading.

- AdminUI subscription-requests pagination pattern: drive list state from route query (`limit`, `offset`, `status`, `only`, `order`), request server `page.total` metadata, render table-scoped loading skeleton during transitions, and keep status filter capable of switching between pending and historical (`not_pending`/resolved) requests without full-page rerender.

- Audit emission pattern: domain/application flows and services enqueue `AUDIT_REQUESTED` through a shared helper with explicit actor context (admin/system), action code, and metadata payload, while composition layers pass outbox/idGen dependencies explicitly.

- Mock adapter synthesis pattern: load terminal people from JSON catalog (fixed + random profile), run generation on configured interval, generate 1..5 events per device sequentially with 1s spacing, and process devices concurrently to mimic real terminal behavior.
- Worker dev orchestration pattern: `apps/worker` exposes `dev` for default local run (preprocess + access-events + outbox + monitoring) without retention; retention remains an explicit separate worker command.
- AdminUI dashboard widget-gating pattern: do not gate the dashboard route by data-widget permissions; load each widget only when permission is present, handle widget errors independently, and show an explicit "no available widgets" empty state when none are accessible.
- AdminUI invite-sharing pattern: invite creation success should expose both raw token and absolute invite URL with separate copy actions to support operator workflows (chat/email) without manual URL construction.
- Adapter identity pattern: DeviceService treats adapter identity as vendorKey + instanceKey (default instanceKey=vendorKey), rejects duplicate live identity registrations (`adapter_instance_active`), and reuses adapterId when the same identity reconnects after TTL; UI should display instanceName to distinguish instances.
- Admin self-profile update pattern: expose PATCH /api/auth/me behind verify+requireAdmin, validate payload with contracts schema, enforce unique email in IAM service, and return normalized admin DTO from composition feature.
- Clean Architecture: core (domain/usecases/ports), infra adapters (Drizzle repos), db schema/migrations, worker entrypoints.
- Repository pattern and port interfaces for external services (audit log, person resolver).
- Core services layer pattern: services per bounded context (auth/admin) gate repo access; repos and services expose `withTx` for sync transaction wiring; UCs depend on services only.
- Transaction propagation pattern: every core repo and service exposes `withTx(tx)`; service `withTx` rebinds all `*Repo` deps to `repo.withTx(tx)` and returns a same-contract service instance.
- IAM bounded context owns identities and access (admins, roles, invites, password resets, telegram links).
- Cross-BC reads use read-only query ports (no business logic); cross-BC writes are implemented as usecases.
- xBC admin projection pattern: cross-BC admin list views (e.g., subscriptions + parent + person) live in `core/ports/queries/*` with shared view types in `core/ports/queries/models/*`; BC repos stay focused on BC-local entities and writes.
- Avoid service-to-service dependencies across BC boundaries.
- IAM implementation pattern: repo interfaces and constants moved under `core/iam`, services are single-repo write gates, flows aggregate intra-BC operations, and read-only query ports live under `core/ports/queries/iam`.
- IAM refinement pattern: entity types live in `core/iam/entities`, repos import entity types, and flows are grouped by domain subfolders when the flow count grows.
- BC typing pattern: flow/service/usecase input-output and deps types live in adjacent `*.types.ts` files and are exported from the BC index alongside their flow/service.
- Flow usage pattern: flows are created only when coordinating multiple services inside a BC; single-service operations live on the service (ports allowed).
- Auth token pattern: IAM auth service issues access JWTs and opaque refresh tokens; refresh tokens are argon2-hashed, one-time, and rotated on use with device/ip/userAgent metadata stored.
- Telegram code pattern: admin telegram codes carry explicit purpose (`link` vs `login`) and flows/strategies enforce purpose matching.
- Settings BC pattern: runtime settings are owned by SettingsService; DB overrides are applied and snapshot includes env/db/effective values via RuntimeConfigProvider.
- Settings pipeline pattern: runtime settings use a registry of keys and a parseРІвЂ вЂ™overridesРІвЂ вЂ™snapshot pipeline; new settings are added by registry entry without changing pipeline logic.
- Registry organization pattern: when a registry grows, split registrations into per-domain files and keep a thin aggregator index.
- Registry typing pattern: derive group unions from registry keys and bind entry value types to config selectors via helper functions.
- Pipeline typing pattern: keep pipeline functions generic and map to concrete domain shapes in the service layer.
- Settings write pattern: setRuntimeSettings uses registry parse/serialize hooks to avoid duplicated schemas and per-key mapping.
- Registry callback pattern: use bivariant helper types for entry callbacks when exact optional types cause assignability errors.
- Outbox pattern for event processing and worker loops for background tasks.
- Worker processes run as separate entrypoints; `dev:all`/`start:all` orchestrate multiple workers via `concurrently`.
- Monorepo layout: apps/ for entrypoints and packages/ for shared layers (core, infra, db, tests).
- Workspace package pattern: apps and packages import shared code via `@school-gate/*`; shared packages build to local `dist` with exports, while tsconfig paths map to source for repo-wide typecheck.
- Infra barrel export pattern: `packages/infra/src` and its key subdirectories (`config`, `drizzle`, `drizzle/repos`, `drizzle/queries`, `logging`, `ops`, `security`) expose `index.ts` barrels; package exports expose both root (`.`) and directory index entrypoints.
- Core package export pattern: `@school-gate/core` exposes a single root entrypoint; public API is re-exported from `packages/core/src/index.ts` (no subpath exports).
- DeviceService uses a dedicated packages/device subtree with its own core/infra/device-db and migrations.
- Sync UnitOfWork wraps transactional usecases and enforces no async operations inside transactions.
- Device outbox transport follows port/adaptor: core defines `CoreIngestClient`, infra implements HTTP client, and worker usecases depend on the port.
- Runtime settings layering: env defaults come from `packages/config`, while DB overrides are read via core `getRuntimeSettings` usecase and applied in worker entrypoints.
- Runtime settings snapshot follows port/adaptor: core defines `RuntimeConfigProvider`, infra implements it via `packages/config`, and core usecases expose env/db/effective values for admin delivery layers.
- API composition pattern: `apps/api` is split into `runtime` (env/db/logger/providers), `composition/features` (per-feature handler wiring), and `delivery/http` (`createHttpApp` + routes/middleware).
- Hono delivery pattern: HTTP app assembly happens in `createHttpApp`; middleware sets request context (`requestId`, `logger`) via `c.set`, and route modules stay thin with Zod DTOs from `packages/contracts`.
- API route DSL pattern: delivery routes use `handler(({ c, body, query, params }) => ...)` for execution only; response schema and domain-error mapping are defined via separate middleware (`useResponse`, `useErrorMap`).
- OpenAPI delivery pattern: `apps/api` uses `OpenAPIHono` with shared `defineRoute` helper so routes stay thin while request/response/security docs are declared centrally; docs are exposed at `/openapi.json` and `/docs` via Scalar.
- DeviceService delivery pattern: `apps/device-service` mirrors the same approach with `delivery/http` (`createHttpApp`, route-level `handler`, middleware for auth/validation/response), keeping handlers method-only and moving business shaping to `composition/features`.
- DeviceService OpenAPI pattern: publish docs at `/openapi.json` + `/docs` and explicitly set route `security` (`adminBearerAuth`, `deviceBearerAuth`, `internalBearerAuth`) so Scalar clearly marks authorization requirements per endpoint.
- DeviceService error mapping pattern: use centralized `mapErrorToFailure` in app-level `onError` with a shared domain error registry, so handlers/features throw errors while delivery consistently shapes API failures.
- API prefix pattern: delivery HTTP endpoints are normalized under `/api/*` (including former admin endpoints), while ingest remains under `/api/events*` and auth/admin features live under `/api/auth`, `/api/admins`, etc.
- CORS whitelist pattern: browser-facing routes use Hono CORS middleware with explicit origin whitelist from env (`API_CORS_ALLOWED_ORIGINS`, `DEVICE_SERVICE_CORS_ALLOWED_ORIGINS`), CSV format, `credentials: true` for cookie auth, and default `http://localhost:5000` for local frontend.
- AdminUI auth/session pattern: `apps/admin-ui` uses an API client that parses the shared `{ success, data?, error? }` envelope, applies bearer auth, and performs single-flight refresh retry on 401 via `/api/auth/refresh`; session is persisted as memory + localStorage and cleared on invalid/expired refresh.
- Hybrid admin auth pattern: API auth verification is bearer-first with HttpOnly cookie fallback (`sg_admin_access`), login/refresh rotate both access+refresh cookies, `/api/auth/session` resolves current admin from auth context, and `/api/auth/logout` revokes refresh token then clears cookies.
- AdminUI dashboard pattern: first dashboard slice is lightweight and operational, combining `/api/monitoring` snapshot cards with a recent `/api/subscription-requests` list in a shadcn-based shell (login-04 + simplified dashboard-01 composition).
- AdminUI route-protection pattern: enforce a root-level guard that allows only explicit public paths (currently `/login`, `/unavailable`) and redirects all other paths to `/login` when session is missing/expired.
- AdminUI fallback pattern: use dedicated UI routes/components for unavailable backend plus root-level notFound/error components to provide consistent user-facing recovery actions (reload, go dashboard) instead of raw crashes.
- AdminUI invite onboarding pattern: expose `/invite` as a public route accepting `token` from query params; submit flow is `accept invite -> login`, and missing/invalid token state is handled explicitly in UI rather than silent redirect.
- AdminUI form pattern: auth forms use `react-hook-form` + `zod` resolver for validation and `@tanstack/react-query` mutations for submit lifecycle; map backend auth error codes through a centralized message registry for consistent UX across login/invite/reset screens.
- API logging mode pattern: in `apps/api`, development mode (`NODE_ENV=development|dev`) logs to stdout for fast local debugging; non-dev environments keep rotating file logging.
- Delivery slim-handler pattern: route handlers should primarily call feature module methods and return; input validation stays in parse middleware, success envelope is applied in `handler`, and error translation stays in global `onError` with centralized domain error registry.
- API request logging pattern: `requestContext` should emit one structured log per request with requestId + method/path/query/body/header subset + response status/duration; sensitive fields (`password`, `token`, `authorization`, `cookie`, `signature`, `secret`) must be redacted and large body strings truncated to keep logs readable and safe.
- Composition DTO pattern: when response shaping is needed (e.g., Date -> ISO), do it in feature composition handlers rather than in delivery route modules.
- Query parsing middleware pattern: GET query validation/defaulting uses dedicated middleware (`parseQuery`) that writes parsed input into request context, matching JSON parsing flow.
- Delivery error registry pattern: app-level `onError` resolves failures through route-local overrides (`c.get("errorMap")`) and shared `domainErrorRegistry`, keeping route declarations free from repeated error mapping blocks.
- Admin auth pattern: JWT middleware validates admin access and permissions; admin routes use `requirePermissions` guards per endpoint.
- IAM auth composition pattern: API auth feature should use core `createAuthService` with registered strategies (`email_password`, `telegram_code`), core `RefreshTokensService` + infra `RefreshTokensRepo`, and a JwtSigner adapter; delivery contracts expose refresh flow (`/admin/auth/refresh`) and include refresh tokens in login response.
- First-admin bootstrap pattern: expose a public one-time endpoint (`/api/auth/bootstrap/first-admin`) that creates initial `super_admin` only when no admins exist; flow must auto-create `super_admin` role from presets if missing and fail explicitly once system is initialized.
- Admin management pattern: `/admin/admins` endpoints require `admin.manage` and return standard admin DTOs; password resets are issued as links/tokens rather than direct password set.
- Ingestion auth pattern: `/api/events*` uses bearer + HMAC middleware that verifies `X-Timestamp` and `X-Signature` over `${timestamp}.${rawBody}` and stores raw body for later JSON parsing.
- Device registry pattern: DeviceService DB owns the authoritative devices registry; DS validates device assignment/direction before forwarding events to Core.
- Unmatched admin pattern: `/admin/access-events/unmatched` lists unmatched events and `/admin/access-events/mappings` maps terminal identities to persons and requeues events via existing core usecases.
- Persons search pattern: `/admin/persons` delegates to a core usecase that treats 12-digit IIN as exact and shorter inputs as prefix search.
- Subscription requests admin pattern: `/admin/subscription-requests` stays thin over core list/review usecases; approve runs inside sync UnitOfWork to keep subscription activation and audit outbox atomic.
- Retention cleanup pattern: a dedicated retention worker runs a core cleanup usecase over narrow retention repos that delete in limited batches and only remove terminal access-event statuses.
- Scheduled retention pattern: retention is exposed as a one-shot entrypoint and an OS-aware schedule applicator (Task Scheduler on Windows, crontab on Linux), keeping `dev:all` focused on always-on workers.
- Retention schedule admin pattern: OS scheduling logic lives in an infra ops service and is reused by both CLI scripts and thin admin routes (`/admin/retention/schedule/apply`).
- Retention lifecycle admin pattern: `/admin/retention/run-once` and `/admin/retention/schedule/remove` remain thin over the same infra ops service and return typed DTOs with ISO timestamps.
- Monitoring snapshot pattern: `/admin/monitoring` is a thin route over a core monitoring usecase and an infra monitoring repo that aggregates counts and lag markers directly from SQLite.
- Monitoring collector pattern: monitoring snapshot РЎРѓР В±Р С•РЎР‚Р С”Р В° Р С‘Р Т‘РЎвЂРЎвЂљ РЎвЂЎР ВµРЎР‚Р ВµР В· pipeline + registry Р С”Р С•Р В»Р В»Р ВµР С”РЎвЂљР С•РЎР‚Р С•Р Р† Р Р† `monitoring/collectors`, Р Т‘Р С•Р В±Р В°Р Р†Р В»Р ВµР Р…Р С‘Р Вµ Р Р…Р С•Р Р†Р С•Р в„– РЎРѓР ВµР С”РЎвЂ Р С‘Р С‘ = Р Р…Р С•Р Р†РЎвЂ№Р в„– collector + РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘РЎРЏ.
- Alerts rule pattern: Р С•РЎвЂ Р ВµР Р…Р С”Р В° Р С—РЎР‚Р В°Р Р†Р С‘Р В» Р Р†РЎвЂ№Р Р…Р ВµРЎРѓР ВµР Р…Р В° Р Р† strategy registry (evaluator per rule type) РЎРѓ Р ВµР Т‘Р С‘Р Р…РЎвЂ№Р С parser Р Т‘Р В»РЎРЏ config.
- Alerts registry-first typing: `AlertRuleType` Р С‘ `AlertRuleConfig<T>` Р Р†РЎвЂ№Р Р†Р С•Р Т‘РЎРЏРЎвЂљРЎРѓРЎРЏ Р С‘Р В· `alertRuleRegistry` (parse Р Р†Р С•Р В·Р Р†РЎР‚Р В°РЎвЂ°Р В°Р ВµР СРЎвЂ№Р Вµ РЎвЂљР С‘Р С—РЎвЂ№).
- Worker heartbeat pattern: workers write start/success/error signals into `worker_heartbeats`, and monitoring aggregates heartbeats plus top errors for prod-style operational visibility.
- Monitoring TTL pattern: heartbeat staleness is computed using a runtime-configured TTL (`monitoring.worker_ttl_ms`) and exposed as ok/stale status per worker.
- Adapter integration pattern: vendor adapters run as separate services, register with DeviceService, push realtime events, and support `fetchEvents(sinceEventId, limit)` for backfill; DS is passive and owns cursor/ack and retry policy for Core delivery.
- Device cursor pattern: DS stores per-device lastAckedEventId/lastAckedAt and advances cursor only after Core accepts events; backfill reads from cursor and relies on adapter retention for recovery.
- DeviceService adapter API pattern: adapters authenticate to DS, register/heartbeat for assignments, and push normalized events to DS, which records and enqueues for Core delivery.
- Backfill runner pattern: DS triggers adapter backfill on register/heartbeat with throttling and uses adapter HTTP client to fetch events since cursor.
- Mock adapter pattern: a standalone adapter app stores raw events in SQLite, exposes /events/backfill, registers/heartbeats with DS, and pushes batches to validate the DS РІвЂ вЂќ Core pipeline.
- Response envelope pattern: delivery returns `{ success: true, data }` or `{ success: false, error: { code, message, data? } }`, with shared helpers in `apps/api/src/delivery/http/response.ts`.
- HTTP delivery servers should use Hono (except adapter, which can remain minimal node http).
- Bot delivery pattern: outbox worker checks bot health before claiming notifications and sends rendered templates via internal bot HTTP API; bot service holds Telegram token and enforces shared internal auth.
- Bot recipient contract pattern: internal notification delivery uses `tgUserId` as receiver identity in worker->bot HTTP payloads; only Telegram transport adapter maps `tgUserId` to Telegram `chat_id`.
- Bot logging mode pattern: in `apps/bot`, development mode (`NODE_ENV=development|dev`) logs to stdout for interactive debugging, while non-dev keeps rotating file logging.
- Telegram interaction pattern: `apps/bot` runs Telegraf long polling in the same process as internal bot HTTP API, uses `session({ defaultSession })` for lightweight state (`awaitingIin`), keeps parent UX private-chat-only, and combines reply keyboard (section navigation) with inline callbacks (subscription toggle actions).
- Alerting pattern: monitoring snapshots feed alert rules; rule transitions emit alert events and outbox notifications to Telegram subscribers.

## Testing Patterns

- Vitest for unit/integration tests under `packages/test`, with DB helpers in `packages/test/helpers`.

2026-01-25 21:55:41 - Initialized system patterns from repo tooling and structure.

- AdminUI password reset pattern: expose two public routes (/password-reset/request, /password-reset/confirm) with token-based confirm flow, zod + react-hook-form validation, react-query mutations, and shared auth error mapper for consistent feedback.

- AdminUI bootstrap pattern: provide dedicated public setup route (/bootstrap/first-admin) that calls one-time backend bootstrap, maps irst_admin_already_exists to actionable UI, and auto-signs in on success.

- AdminUI cookie-session pattern: auth state must be sourced from backend session cookies (credentials: include) with runtime session resolution (/api/auth/session) instead of localStorage token persistence; route guards should be async and session-aware.

- AdminUI interaction-state pattern: encode cursor/focus-visible/transition behavior in base primitives (Button/Input) to propagate consistent UX across all route screens without per-page duplication.
- AdminUI dashboard list pattern: render recent operational items using shadcn table primitives for clearer scanning and predictable responsive overflow behavior.

- AdminUI accessibility baseline pattern: root shell should expose a skip-link and stable main content target; icon-only controls must include explicit aria-labels.
- AdminUI feedback pattern: support both assertive alerts and polite status live regions in shared alert primitive, so success states are announced without disrupting assistive tech flow.
- Telegram dual-role bot pattern: when user can be both parent and admin, keep a lightweight session mode (`parent`/`admin`) with explicit keyboard switchers; admin mode availability is derived from IAM link (`admins.tgUserId`) and `/link <code>` is handled as an in-bot command mapped to domain link flow/errors.
- AdminUI TanStack Start auth pattern: resolve session via createServerFn in root beforeLoad, forward incoming cookie header to backend auth endpoints, forward Set-Cookie back to response, and hydrate client session-store from root route context to keep SSR/CSR auth state consistent.
- AdminUI shell interaction pattern: keep mobile drawer and desktop collapse as separate states; header profile control contains avatar, role metadata, and account actions in a compact dropdown aligned to top-right.
- AdminUI profile management pattern: expose protected /profile route with account form + Telegram link-code generation; when backend profile update endpoint is unavailable, surface explicit API-contract guidance in UI instead of silent failure.
- AdminUI role display pattern: when session provides both roleName and roleId, UI should render roleName for user-facing text and keep roleId only as fallback/debug metadata.

- AdminUI alerts page pattern: keep alerts as a dedicated route (/alerts) with summary cards, rule table, recent event feed, and per-admin subscription toggles backed by /api/alerts/rules,/events,/subscriptions APIs.
- AdminUI alert rule creation pattern: launch create flow in contextual overlay (Sheet desktop, Drawer mobile), keep one shared form component with type-specific config fields, and refresh list data immediately after successful mutation.
- AdminUI alerts interaction pattern: use Switch for per-rule subscription toggles and contextual Sheet/Drawer for create/edit rule forms with immediate list refresh after mutation.

- AdminUI settings interaction pattern: runtime settings are organized as shadcn Tabs, and each tab lazily loads its section snapshot on demand; save/reset/refresh actions remain section-scoped to reduce noise and backend load.
- AdminUI device operations pattern: expose a dedicated Device Operations nav section and protected routes (`/devices`, `/devices/adapters`, `/devices/monitoring`) backed by `/api/ds/*`; enforce `devices.read` for visibility/data and `devices.write` for mutations, use Sheet/Drawer for create-edit flows, and keep server_unreachable => `/unavailable` handling consistent across views.


- API device-service gateway pattern: expose /api/ds/* thin delivery routes in pps/api and forward to pps/device-service via composition feature; reuse contracts for request/response parsing, require devices.read/devices.write permissions, and map upstream envelope/network failures to shared HttpError-based app-level error handling.

- DeviceService gateway pattern: apps/api exposes /api/ds/* as thin admin endpoints that proxy to apps/device-service, forwarding Authorization when present and otherwise minting admin JWT from request context; DS internal monitoring is proxied via internal token.
- AdminUI device-ops pattern: Device Operations is split into /devices, /devices/adapters, /devices/monitoring with shadcn UI, permission-gated mutations (devices.write), and server_unreachable fallback to /unavailable.

- AdminUI admin-management pattern: split admin management into /admins (account operations) and /admins/roles (permission model), gate both by dmin.manage, use shadcn Sheet/Drawer for create/edit flows, and keep mutation feedback inline via alerts with immediate data refresh.

- AdminUI IAM safety-guard pattern: forbid self role changes in admin management UI and prevent disabling the last active super_admin; enforce both in mutation handlers and disable related controls with inline hints.

- AdminUI invite role-composition pattern: invite form supports two role sources (existing role or inline new role with permission switches); when creating new role, flow is sequential (create role -> create invite) in one user action.

- AdminUI role-preset pattern: for inline role creation in invite flow, offer one-click permission presets (Viewer/Operator/Admin) as accelerators while preserving manual per-permission toggles for final tuning.

- AdminUI subscription-requests pattern: expose dedicated /subscription-requests route with permission-aware visibility (subscriptions.read/subscriptions.review), filterable queue table, and inline approve/reject actions; disable review actions when admin tg link is missing because backend requires dminTgUserId.

- AdminUI access-events moderation pattern: expose unmatched queue in /access-events with permission-aware read/map controls; run terminal-identity mapping in contextual Sheet/Drawer with inline person search by IIN and immediate queue refresh after successful mapping.

- Telegram OTP auth pattern: admin-ui login offers password + telegram modes; telegram mode requests code by email, backend verifies linked tgUserId, sends 6-digit OTP through internal bot notification endpoint, and completes login via /api/auth/telegram/login with standard HttpOnly access/refresh cookie issuance and root session hydration.

- Persons device-identity pattern: keep person profile data and device-specific terminal identities separated; manage identities in dedicated UI section (/persons/:id) and API sub-routes (/:personId/identities) with conflict checks for (deviceId, terminalPersonId) and one-identity-per-person-per-device.




- AdminUI access-events full-list pattern: expose GET /api/access-events with query filters + page metadata, render full event stream in UI with filter form and server pagination, and keep mapping action available only for rows with status UNMATCHED.

- AdminUI access-events interaction pattern: keep filters in collapsible panel with applied-count badge, SSR-load first page via server function (cookie-forwarded), then run client-only pagination/filter updates with table-scoped loading skeleton and smooth scroll-to-table on page/filter transitions.

- AdminUI subscription-request triage pattern: treat resolutionStatus='new' as unresolved/needs-person in moderation UI, expose explicit Resolve Person action (Sheet on desktop, Drawer on mobile), and keep Approve gated only for ready_for_review + personId while Reject remains available for pending requests.

- AdminUI collapsed-branding pattern: in desktop-collapsed sidebar mode, replace verbose text branding with a compact branded icon while keeping full text branding in expanded mode and preserving accessibility labels/tooltips.


- AdminUI sidebar composition pattern: use shadcn Sidebar primitives (SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu*) as the app-shell navigation foundation, with provider-managed desktop collapse and mobile sheet state while keeping permission-aware item visibility in route layer.


- Subscription review requester-notification pattern: on approve/reject, review flow enqueues a second outbox event for Telegram requester notification in the same transaction as status/audit updates, so delivery remains retryable and idempotent via outbox semantics.

- AdminUI Telegram binding toggle pattern: profile Telegram section is state-driven by session.admin.tgUserId; linked state shows unlink action only, unlinked state shows link-code generation and /link instructions. Backend provides authenticated /api/auth/telegram/unlink to clear tg binding explicitly.

- AdminUI navigation IA pattern: sidebar information architecture is declared in lib/navigation/sidebar.ts as permission-aware groups, with explicit Main and separate Monitoring group (Monitoring, Alerts, Settings), while Profile is intentionally excluded from sidebar and remains accessible only via header avatar dropdown.


- Access events admin-query pattern: list endpoint should be backed by a dedicated read-model query port (`core/ports/queries`) and infra SQL adapter that enriches rows with mapped person context and effective IIN while preserving filters/pagination semantics.
- Access events table density pattern: keep desktop rows single-line with fixed column budgets, move attempts/error details to icon tooltip diagnostics, and expose mapped person context via hover-card trigger to reduce horizontal noise.
- Access events URL-state pattern: route search params own filters+pagination (`validateSearch` + `loaderDeps`) and UI state keeps only draft inputs, so refresh/share restores view and SSR first render stays query-driven.


- Audit logs list pattern: /api/audit-logs returns { logs, page } with rom/to ISO date-time filters, and AdminUI /audit-logs mirrors access-events behavior (route alidateSearch, loaderDeps, SSR server-function first load, URL-synced filters, table-scoped loading, and server pagination controls).

- Device settings schema validation pattern: adapter `deviceSettingsSchema` is validated as JSON Schema draft 2020-12 at registration time, and device `settingsJson` is validated against the effective adapter schema on upsert/update (including adapterKey switch with inherited settings).

- DS identity auto-resolve pattern: identity lookup is centralized in DeviceService resolver over enabled devices with settingsJson.identityQueryMappings, while worker and admin UI consume the same DS endpoint (/api/identity/find) with default limit=1 to avoid duplicated adapter-orchestration logic.

- Adapter capabilities declaration pattern: adapter register payload exposes capabilities as string[] (named flags), and DS feature checks use includes('<capability>') instead of object booleans.

- Device settings form pattern: render adapter-provided JSON schema as structured nested UI (object cards, enum selects, array editors, map editors) with fallback only when schema is unsupported; keep sheet/drawer forms scrollable with sticky submit actions for long device settings.

- Adapter HTTP response pattern: adapter-facing device client accepts both raw payload and envelope payloads; when envelope is present it requires success=true and unwraps data; for identity lookup it reads data.matches[] and uses the first match for DS resolver compatibility.

- Persons pre-create identity preview pattern: expose /api/persons/identities/auto/preview/by-iin for live IIN validation-time suggestions, then apply selected mappings right after person creation to keep manual and auto flows consistent.
- Device-scoped identity lookup pattern: DS /api/identity/find accepts optional deviceId to narrow lookup for Add Identity UX while preserving default cross-device scan behavior.

- Person link-status list pattern: persons list API exposes hasDeviceIdentities computed from person-device identity mappings on the current page, and AdminUI table renders operational status (Linked/Not linked) instead of raw terminal IDs.
- Shared person hover-card pattern: use a single PersonHoverCard component with Open profile action across Access Events and Subscription Requests to keep person context UI consistent.

- Device operations list-controls pattern: standardize large DS lists with in-page query filters, status/mode filters, sort selects, page-size selects, and explicit pagination summary for predictable operator workflows.
- Shared pagination component pattern: use one local pagination primitive (DeviceListPagination) across related module screens to keep table/list navigation behavior consistent.

- AdminUI breadcrumb pattern: resolve breadcrumbs from sidebar navigation definitions first, then route-specific overrides, then URL-segment fallback; hide breadcrumbs on dashboard and keep compact fallback title text when chain is empty.
[2026-02-17 08:51:32] - Pattern update: documented admin-ui breadcrumb generation and fallback behavior in app shell.

- Admin self-password-change pattern: expose authenticated PATCH /api/auth/me/password (and /api/me/password alias) requiring currentPassword + newPassword, validate current password on backend before hash update, and keep confirm-password validation in UI form layer.
- Auth OTP input pattern: Telegram login verification uses a segmented OTP input with numeric-only normalization, auto-advance/backspace navigation, and paste support while preserving server-side code validation.
[2026-02-17 09:39:15] - Pattern update: documented OTP input and authenticated self-password-change patterns.

- AdminUI i18n rollout pattern: localize operational screens by combining shared enum-label helpers and interpolation keys (status/result templates) instead of inline literals; validate changes by running admin-ui tests and build after each module batch.
[2026-02-17 22:11:36] - Pattern update: documented incremental AdminUI i18n rollout for access-events/subscription-requests/device-monitoring modules.

- Legacy compatibility adapter pattern: when core module paths or dependency shapes evolve (repo -> service), provide thin adapters at old import paths (usecases/*, uth/*) that normalize deps and preserve historical tests/integration code while keeping new implementations in canonical modules.
[2026-02-23 02:22:10] - Pattern update: documented compatibility adapter strategy used to reduce breakage during core architecture migration.

- HTTP response normalization pattern: delivery handler should normalize Date values to ISO strings before response-schema validation, so module/flow outputs with Date objects remain compatible with strict DTO schemas without duplicating per-route mappers.
- Legacy route-compat pattern: routes may accept historical module return forms (array/boolean) and normalize to current envelope DTO shape to prevent runtime 500s during migration windows.
[2026-02-23 02:35:56] - Pattern update: documented response normalization and legacy route-compat behavior used for production-readiness stabilization.
