# Decision Log

This file records architectural and implementation decisions using a list format.
2026-01-25 21:52:45 - Log of updates made.

## Decision

- 2026-01-25: Use a combined worker runner for development to start both workers with one command.
- 2026-01-25: Use `tsx` as the dev-time TS runner for worker entrypoints.
- 2026-01-26: Use sync UnitOfWork for transactional review and enqueue audit events to outbox.

## Rationale 

- Keep a single command for local development and production-style operation.
- Avoid manual compilation during development while keeping TypeScript entrypoints.
- Ensure review changes and outbox enqueue are atomic with better-sqlite3 sync transactions.

## Implementation Details

- `pnpm dev` runs `tsx apps/worker/src/runAll.ts`, which spawns the worker entrypoints.
- `tsx` added as a devDependency.
- `review` usecase runs inside sync UnitOfWork and emits `audit.requested` to outbox.
- Outbox supports lease reclaim (processing_at/by) and audit logs deduplicate by `event_id` (migration 0007).

---
### Decision Record
[2026-02-09 20:16:27] - Standardize `apps/device-service` OpenAPI input docs and failure mapping through shared helpers.

**Decision Background:**
After the delivery refactor, OpenAPI documented mostly body payloads and error translation still lived directly in `createHttpApp` as ad-hoc checks.

**Available Options:**
- Option 1: Keep minimal OpenAPI helper and inline `onError` branching.
  - Pros: fewer helper files.
  - Cons: docs miss `params/query/headers`, and failure mapping grows inconsistent.
- Option 2: Extend shared OpenAPI helper and introduce centralized `mapErrorToFailure` + domain registry.
  - Pros: consistent route docs and one error translation path.
  - Cons: slightly more internal abstraction.

**Final Decision:**
Use Option 2. `defineRoute` now supports `body/query/params/headers` with safe OpenAPI metadata handling, and app-level `onError` delegates to `mapErrorToFailure` plus a shared domain error registry.

---
### Decision Record
[2026-02-09 22:39:07] - Unify bot internal notification contract to `tgUserId` for private-chat delivery semantics.

**Decision Background:**
Worker and bot-service notification path mixed `chatId` and `tgUserId` naming for the same receiver identity, creating refactor risk and ambiguous intent.

**Available Options:**
- Option 1: Keep `chatId` in internal HTTP contract and map from `tgUserId` in worker sender.
  - Pros: aligns with Telegram API field name.
  - Cons: leaks transport detail into domain-level contracts and preserves naming drift.
- Option 2: Use `tgUserId` end-to-end in worker -> bot API contract and map to Telegram `chat_id` only in Telegram client adapter.
  - Pros: clear domain semantics, single receiver identity term, lower mismatch risk.
  - Cons: requires small contract/test refactor.

**Final Decision:**
Use Option 2 for current private-chat scope. Internal bot API accepts `tgUserId`; Telegram adapter remains responsible for translating it to `chat_id` when calling Telegram Bot API.

---
### Decision Record
[2026-02-09 22:45:58] - Use stdout logger for `apps/bot` in development, keep rotating file logger for non-dev.

**Decision Background:**
During local bot flow debugging, bot logs written only to file slowed feedback loop and made runtime troubleshooting less convenient than API app behavior.

**Available Options:**
- Option 1: Keep file logger in all environments.
  - Pros: single behavior across environments.
  - Cons: poor local DX and inconsistent with API dev logging.
- Option 2: Match API pattern: stdout logger in dev, rotating file logger otherwise.
  - Pros: fast local debugging, consistent platform behavior, no production logging regression.
  - Cons: dual-path logger initialization.

**Final Decision:**
Use Option 2. `apps/bot` now switches logger by `NODE_ENV` (`development|dev` => stdout logger; non-dev => rotating file logger).

---
### Decision Record
[2026-02-09 19:49:10] - Refactor `apps/device-service` to handler-first delivery with middleware-owned cross-cutting concerns.

**Decision Background:**
`apps/device-service` had a monolithic HTTP app and route handlers mixing auth, input parsing, response formatting, and business logic. This reduced readability and made feature changes risky.

**Available Options:**
- Option 1: Keep existing route layout and only add OpenAPI/Scalar.
  - Pros: minimal code movement.
  - Cons: preserves high handler complexity and weak separation of concerns.
- Option 2: Rebuild delivery around thin handlers + middleware and move business shaping into composition features.
  - Pros: explicit navigation, predictable route declarations, easier testability and extension.
  - Cons: larger refactor and temporary compatibility layer complexity.

**Final Decision:**
Use Option 2. Introduce `delivery/http` primitives (`handler`, `parseBody`, `requireBearer`, `adminAuth`, `useResponse`), move adapter/devices/monitoring business branches into `composition/features`, and centralize HTTP failure mapping in app-level `onError`.

**Risks and Mitigation:**
- Risk 1: Breaking tests/importers relying on old entrypoints and `/admin/*` paths.
  - Mitigation: keep compatibility wrappers (`api/app.ts`, `api/adminAuth.ts`, `routes/*.routes.ts`) and keep `/admin/*` aliases in parallel with `/api/*`.

---
### Decision Record
[2026-02-09 04:04:41] - Centralize HTTP error translation in app-level registry and keep route handlers method-only.

**Decision Background:**
Route modules still contained repeated per-route error maps and DTO mapping helpers, which reduced readability and made delivery layer heavier than intended.

**Available Options:**
- Option 1: Keep per-route `useErrorMap` declarations and local DTO mappers.
  - Pros: explicit per-endpoint behavior.
  - Cons: duplicated error mapping and route bloat.
- Option 2: Move DTO shaping to composition features and map domain errors centrally in app `onError` via shared registry.
  - Pros: thinner routes, single source of error mapping truth, clearer delivery responsibility boundaries.
  - Cons: requires broader feature/module contract updates.

**Final Decision:**
Use Option 2. Keep handlers declarative (`handler(({ c, body, query, params }) => ...)`), push DTO mapping into `composition/features`, and resolve errors via global registry with optional route overrides.

**Risks and Mitigation:**
- Risk 1: API module contract shifts can break test stubs and compatibility.
  - Mitigation: retain compatibility aliases where needed (`adminAuthHandlers`, `handlers`, `createVerifyIngestAuthMiddleware`) during migration.

---
### Decision Record
[2026-02-09 00:47:22] - Finalize delivery DX: `handler(({ c, body, query, params }) => ...)` with response/error concerns moved to dedicated middleware.

**Decision Background:**
Even after the previous cleanup, route declarations still mixed execution and route contract/error declarations. The target DX requires handlers to focus only on method invocation.

**Available Options:**
- Option 1: Keep `createRoute` config (`run/responseSchema/errors`) in one place.
  - Pros: compact central API.
  - Cons: handler declaration still carries non-execution concerns.
- Option 2: Split concerns fully: `handler` for execution only, `useResponse` and `useErrorMap` as explicit middleware.
  - Pros: cleaner delivery role, easier scanning of middleware chain, predictable extension point for cross-cutting behavior.
  - Cons: requires broad route migration.

**Final Decision:**
Use Option 2 and migrate all `apps/api` route modules to middleware-driven response/error configuration with `handler` execution context (`body/query/params` raw-fallback aware).

**Implementation Plan:**
- Step 1: Replace `createRoute` with `handler`.
- Step 2: Add `useResponse` and `useErrorMap` middleware primitives.
- Step 3: Switch context from `input` to `body/query/params`.
- Step 4: Migrate all routes and composition wiring (`handlers` -> `module`).

**Risks and Mitigation:**
- Risk 1: Wide migration can introduce wiring regressions.
  - Mitigation: enforce compile/lint checks for `apps/api` and keep fail-envelope semantics in `onError`.

---
### Decision Record
[2026-02-08 22:17:28] - Simplify delivery DX further: keep handlers method-only and move DTO shaping to composition.

**Decision Background:**
Initial DSL + presenter refactor reduced `try/catch`, but route declarations still felt verbose due to explicit presenter wiring per endpoint.

**Available Options:**
- Option 1: Keep presenters and accept verbose route declarations.
  - Pros: strict explicit mapping.
  - Cons: heavier delivery code and weaker scanability.
- Option 2: Remove presenters, keep response schema parsing in route wrapper, and return final DTOs from composition handlers.
  - Pros: thinner delivery handlers, explicit middleware-driven input validation, simpler route navigation.
  - Cons: composition layer owns more DTO shaping.

**Final Decision:**
Use Option 2. `createRoute` now applies response schema + `ok` envelope, while handlers in delivery mainly call feature methods and return results.

**Implementation Plan:**
- Step 1: Remove presenter usage from migrated routes.
- Step 2: Extend `createRoute` to parse output via `responseSchema`.
- Step 3: Shift date/DTO shaping to feature composition (`auth`, `subscriptions`).

**Risks and Mitigation:**
- Risk 1: DTO conversion logic duplication across features.
  - Mitigation: keep conversion close to feature handlers and extract shared mappers only when repetition appears.

---
### Decision Record
[2026-02-08 21:41:40] - Make API handlers declarative with route DSL, centralized HttpError mapping, and presenter-based response shaping.

**Decision Background:**
After the large `apps/api` restructure, route handlers still contained repetitive `try/catch`, inline domain error mapping, and DTO shaping logic, which made navigation harder and increased local complexity.

**Available Options:**
- Option 1: Keep per-handler `try/catch` and only extract tiny helpers.
  - Pros: minimal change surface.
  - Cons: repeated error mapping and uneven route readability remain.
- Option 2: Introduce route DSL + global HttpError mapping + presenters, then migrate pilot routes.
  - Pros: explicit control flow, thinner handlers, centralized error strategy, easier incremental migration.
  - Cons: requires new delivery-layer primitives.

**Final Decision:**
Use Option 2. Add reusable delivery primitives (`HttpError`, `createRoute`, query parser middleware, presenters) and migrate `adminAuth` and `subscriptionRequests` routes to this style while preserving external response contracts.

**Implementation Plan:**
- Step 1: Add `HttpError` and global error mapping in `createHttpApp`.
- Step 2: Add `createRoute` DSL and `requireAdmin` guard helper.
- Step 3: Add query parsing middleware and presenters for pilot routes.
- Step 4: Migrate pilot handlers from inline logic/`try/catch` to declarative route definitions.

**Risks and Mitigation:**
- Risk 1: Behavior drift in error codes/messages during migration.
  - Mitigation: keep route-level explicit error mapping tables and validate with API build/lint and targeted route tests where environment supports it.

---
### Decision Record
[2026-02-08 19:27:57] - Rebuild `apps/api` composition around runtime + feature modules and root package exports.

**Decision Background:**
`apps/api` was broken by obsolete deep imports and a monolithic composition root that mixed runtime setup, dependency wiring, and HTTP delivery concerns.

**Available Options:**
- Option 1: Minimal import fix inside existing monolithic `src/index.ts`.
  - Pros: faster short-term patch.
  - Cons: preserves low readability and high coupling.
- Option 2: Rebuild API composition into explicit layers (`runtime` -> `composition/features` -> `delivery`).
  - Pros: clear navigation, maintainable boundaries, easier future changes.
  - Cons: larger refactor now.

**Final Decision:**
Use Option 2 and refactor `apps/api` into explicit runtime/composition/delivery layers while preserving existing entrypoint compatibility through `src/app.ts`.

**Implementation Plan:**
- Move runtime wiring to `src/runtime/createRuntime.ts`.
- Split feature handler composition under `src/composition/features/*`.
- Move HTTP app assembly to `src/delivery/http/createHttpApp.ts` and keep `src/index.ts` as thin bootstrap.

**Risks and Mitigation:**
- Risk 1: regression from broad wiring changes.
  - Mitigation: keep route contracts intact and validate with `pnpm --filter @school-gate/api build`.

---
### Decision Record
[2026-01-27 15:20:38] - Align monorepo packages to ESM by setting `"type": "module"` in package.json files.

**Decision Background:**
`apps/api` uses `NodeNext` with `verbatimModuleSyntax`, which treats packages without a local `"type": "module"` as CommonJS and breaks named exports.

**Available Options:**
- Option 1: Change TypeScript module settings to be more permissive.
  - Pros: fewer package.json edits.
  - Cons: weakens ESM guarantees and can hide real interop issues.
- Option 2: Mark each workspace package as ESM explicitly.
  - Pros: consistent module semantics, minimal behavior change.
  - Cons: requires touching multiple package.json files.

**Final Decision:**
Use Option 2 and add `"type": "module"` to the affected workspace packages.

**Implementation Plan:**
- Step 1: Update `packages/core`, `packages/infra`, `packages/db`, `packages/device`, and `packages/test`.
- Step 2: Validate with `pnpm typecheck`.

**Risks and Mitigation:**
- Risk 1: Any CJS-only imports could break. -> Mitigation: keep imports ESM-style and catch issues via typecheck/tests.

---
### Decision Record
[2026-01-27 16:41:42] - Secure Core ingestion with bearer token plus HMAC request signing.

**Decision Background:**
Core ingestion endpoints are called by DeviceService and should resist spoofing and replay without adding heavy infrastructure.

**Available Options:**
- Option 1: Bearer token only.
  - Pros: simple.
  - Cons: weaker replay/spoof protection.
- Option 2: Bearer token + HMAC with timestamp window.
  - Pros: stronger integrity and replay resistance with minimal complexity.
  - Cons: requires consistent signing and raw-body handling.
- Option 3: mTLS.
  - Pros: strongest transport-level auth.
  - Cons: certificate issuance/rotation overhead for MVP.

**Final Decision:**
Use bearer + HMAC for MVP. Signature is HMAC-SHA256 over `${timestamp}.${rawBody}` with `X-Timestamp` and `X-Signature` headers and a time window.

**Implementation Plan:**
- Step 1: Add HMAC verify middleware that reads/stores raw body.
- Step 2: Update device HTTP client to sign requests the same way.
- Validation Method: API tests cover unauthorized, bad signature, and valid idempotent ingestion.

**Risks and Mitigation:**
- Risk 1: Raw body can be consumed before JSON parse. -> Mitigation: parseJson middleware reads from stored raw body when present.

---
### Decision Record
[2026-02-06 23:41:46] - Move subscriptions admin listing to xBC query layer and keep subscriptions repo BC-pure.

**Decision Background:**
`listForAdmin` returned `subscription + parent + person` from `subscriptions` repo implementation, which mixed BC-local write repo responsibilities with cross-BC read projection (`person` from identities).

**Available Options:**
- Option 1: Keep `listForAdmin` in `SubscriptionsRepo`.
  - Pros: minimal short-term changes.
  - Cons: blurred BC boundaries and weaker DX for repo vs query responsibilities.
- Option 2: Introduce `SubscriptionsAdminQueryPort` + read model under `ports/queries`.
  - Pros: clear xBC read boundary, better DX, aligns with existing query-port pattern.
  - Cons: requires additional adapter and wiring.
- Option 3: Compose response in app-layer from multiple repos.
  - Pros: strict repo purity.
  - Cons: harder pagination/sorting and less efficient than single SQL projection.

**Final Decision:**
Use Option 2. Keep `SubscriptionsRepo` for BC subscriptions operations only, and move admin list projection into a dedicated query adapter behind `SubscriptionsAdminQueryPort`.

**Implementation Plan:**
- Step 1: Add `SubscriptionAdminView` in `core/ports/queries/models`.
- Step 2: Add `SubscriptionsAdminQueryPort` in `core/ports/queries/subscriptions`.
- Step 3: Add `listSubscriptionsAdmin` usecase in core depending on query port.
- Step 4: Move SQL join logic to `infra/drizzle/queries/subscriptionsAdmin.query.ts`.
- Step 5: Remove `listForAdmin` from `infra/drizzle/repos/subscriptions.repo.ts`.

**Risks and Mitigation:**
- Risk 1: Temporary app-layer compile gaps until consumers are rewired. -> Mitigation: apply package-level split first, then migrate app wiring in a dedicated follow-up.

---
### Decision Record
[2026-02-07 02:36:45] - Introduce barrel exports across infra source tree and expose directory/root entrypoints.

**Decision Background:**
Infra imports were mostly deep-path based, and there was no root `src/index.ts` plus no consistent `index.ts` files per directory. This reduced DX and made module discovery harder.

**Available Options:**
- Option 1: Keep only deep-path imports.
  - Pros: no structural changes.
  - Cons: weak discoverability and fragile import ergonomics.
- Option 2: Add barrel indexes per directory and root index, then expose them in package exports.
  - Pros: predictable import surface and easier navigation.
  - Cons: more export maintenance.

**Final Decision:**
Use Option 2 for infra package: create `index.ts` in root and relevant subdirectories, and extend `package.json` exports for root and directory index entrypoints.

**Implementation Plan:**
- Step 1: Add `index.ts` in `config`, `drizzle`, `drizzle/repos`, `drizzle/queries`, `logging`, `ops`, `security`.
- Step 2: Add `packages/infra/src/index.ts` that re-exports through sub-indexes.
- Step 3: Extend `packages/infra/package.json` exports with `.` and directory index paths.

**Risks and Mitigation:**
- Risk 1: Accidental export of unstable internals. -> Mitigation: only re-export existing public infra modules.

---
### Decision Record
[2026-02-07 04:10:59] - Standardize transaction propagation with `withTx` across all core repos/services and infra repo adapters.

**Decision Background:**
`withTx` existed only in selected IAM paths, which made transaction propagation inconsistent across bounded contexts and created gaps where services/repos could not be safely rebound to a transaction scope.

**Available Options:**
- Option 1: Keep `withTx` only in modules currently using sync UnitOfWork.
  - Pros: fewer immediate changes.
  - Cons: inconsistent API surface and hidden transaction limitations.
- Option 2: Enforce `withTx` across all repos and services.
  - Pros: uniform DX and predictable transaction boundary behavior.
  - Cons: broader refactor touching many contracts and adapters.

**Final Decision:**
Use Option 2. Every core repo contract and service contract gets `withTx`, and infra repo adapters implement `withTx` by returning `create*Repo(tx)`.

**Implementation Plan:**
- Step 1: Add `withTx(tx: unknown)` to core repo contracts.
- Step 2: Add `withTx(tx: unknown)` to core service contracts.
- Step 3: Implement `withTx` in service factories by rebinding `*Repo` deps via `deps.repo.withTx(tx)`.
- Step 4: Add `withTx` implementations to infra drizzle repos.
- Step 5: Ensure service parity for repo sync methods (added missing `SubscriptionsService.setActiveByIdSync`).

**Risks and Mitigation:**
- Risk 1: Large contract surface update may require downstream wiring updates. -> Mitigation: keep signatures uniform and scoped to core/infra package layers first.

---
### Decision Record
[2026-01-27 17:09:01] - Make Core ingestion strict against a devices registry (device must be registered and enabled).

**Decision Background:**
Need explicit admin control and safety: unknown devices should not silently create data, and disabled devices should stop ingestion immediately.

**Available Options:**
- Option 1: Strict registry (reject unknown/disabled devices).
  - Pros: safe-by-default, clear admin control.
  - Cons: requires device registration before ingestion works.
- Option 2: Auto-register on ingest.
  - Pros: less setup friction.
  - Cons: weak control and security.

**Final Decision:**
Use strict registry. Ingestion checks `devices` before processing and returns explicit errors when missing/disabled.

**Implementation Plan:**
- Step 1: Add `devices.enabled` to Core DB and expose `/admin/devices`.
- Step 2: Enforce checks in `ingestAccessEvent` and map domain errors at delivery.
- Validation Method: API tests cover unregistered-device rejection and devices admin routes.

**Risks and Mitigation:**
- Risk 1: Operational friction during setup. -> Mitigation: provide clear admin flow to register/enable devices.

---
### Decision Record
[2026-01-27 17:56:20] - Expose unmatched access events and terminal identity mapping via admin API.

**Decision Background:**
Unmatched events must be visible and resolvable by admins without bypassing core domain logic.

**Available Options:**
- Option 1: Build separate ad-hoc SQL endpoints.
  - Pros: fast.
  - Cons: risks violating domain rules and requeue semantics.
- Option 2: Wrap existing core usecases in thin admin routes.
  - Pros: consistent behavior and reuse of mapping requeue logic.
  - Cons: requires additional wiring and DTO contracts.

**Final Decision:**
Use Option 2: `/admin/access-events/unmatched` and `/admin/access-events/mappings` are thin delivery layers over core usecases.

**Implementation Plan:**
- Step 1: Add contracts for unmatched listing and mapping.
- Step 2: Wire `createListUnmatchedAccessEventsUC` and `createMapPersonTerminalIdentityUC` in API composition root.
- Validation Method: API tests cover unmatched listing and mapping requeue.

**Risks and Mitigation:**
- Risk 1: Mapping to a wrong person. -> Mitigation: rely on existing identity conflict checks and keep mapping explicit.

---
### Decision Record
[2026-01-27 18:04:57] - Admin persons search uses exact-or-prefix IIN behavior.

**Decision Background:**
Admins need to find persons quickly during mapping; sometimes they know a full IIN, sometimes only a prefix.

**Available Options:**
- Option 1: Exact-only full IIN.
  - Pros: strict.
  - Cons: poor UX for partial input.
- Option 2: Prefix-only search.
  - Pros: flexible.
  - Cons: loses exact-match semantics.
- Option 3: Exact when 12 digits, prefix otherwise.
  - Pros: best UX without ambiguity for full IIN.
  - Cons: requires a small amount of branching logic.

**Final Decision:**
Use Option 3: 12-digit IIN performs an exact lookup; shorter valid inputs perform prefix search.

**Implementation Plan:**
- Step 1: Extend PersonsRepo with prefix search.
- Step 2: Add a core usecase that branches on IIN length.
- Validation Method: API tests cover prefix and full IIN search.

**Risks and Mitigation:**
- Risk 1: Large prefix queries. -> Mitigation: enforce limits in route validation.

---
### Decision Record
[2026-01-27 18:34:29] - Standardize API responses with a success/error envelope.

**Decision Background:**
We need consistent client handling and clearer error semantics across ingestion, admin APIs, and DeviceService integrations.

**Available Options:**
- Option 1: Keep ad-hoc response shapes per endpoint.
  - Pros: minimal change.
  - Cons: inconsistent clients and error parsing.
- Option 2: Introduce a shared envelope `{ success, data?, error? }`.
  - Pros: consistent, explicit errors with codes/messages/data.
  - Cons: requires updating routes, clients, and tests.

**Final Decision:**
Use Option 2 across all API routes. Errors include `{ code, message, data? }`.

**Implementation Plan:**
- Step 1: Add contracts and response helpers.
- Step 2: Update middleware/onError/routes and update client parsing/tests.
- Validation Method: typecheck and API tests assert the envelope.

**Risks and Mitigation:**
- Risk 1: Breaking change for existing clients. -> Mitigation: update DeviceService client and tests in the same change.

---
### Decision Record
[2026-01-27 23:05:00] - Device adapters are separate services; DS is passive and manages cursor/backfill with one active adapter per vendor.

**Decision Background:**
We need reliable device event ingestion, hot adapter updates, and clear responsibility boundaries between vendor adapters and DeviceService.

**Available Options:**
- Option 1: Embed DeviceService inside Core (single process).
  - Pros: fewer services.
  - Cons: harder hot updates; adapter faults can impact Core.
- Option 2: Keep DeviceService as separate process; adapters are separate services that register to DS.
  - Pros: isolation, hot updates, centralized cursor/retry policy.
  - Cons: more moving parts.

**Final Decision:**
Use Option 2. Adapters are separate services per vendor, DS remains a separate process and is passive (waits for adapter registration). Only one active adapter per vendor; old adapter is drained on updates. Realtime push + backfill fetch are both supported. DS owns cursor/ack and retry policy for Core delivery; adapters store raw events temporarily and expose fetchEvents for backfill.

**Implementation Plan:**
- Step 1: Document adapter handshake and push/backfill contract in device-service spec.
- Step 2: Add cursor/backfill logic in DS and expose ack feedback for adapter GC.
- Step 3: Enforce deterministic eventId and retry classification in DS.

**Risks and Mitigation:**
- Risk 1: Adapter lacks backfill fetch; events may be lost on downtime. -> Mitigation: require fetchEvents(sinceEventId) in vendor adapters and retention policy for raw events.

---
### Decision Record
[2026-01-26 12:20:57] - Captured business/product checklist and MVP scope for schools.

**Decision Background:**
Need clear business scope, roles, and MVP boundaries for product planning.

**Available Options:**
- Option 1: MVP minimal with reduced UX/UI and limited scope.
  - Pros: Faster delivery.
  - Cons: Weak school experience, gaps vs target product.
- Option 2: MVP close to final product with strong UX/UI, but limited legal work and single terminal model.
  - Pros: Strong stakeholder fit, easier scale later.
  - Cons: More build effort upfront.

**Final Decision:**
MVP should be close to the final product with strong admin UX/UI, limited legal work, and a single terminal model via abstraction.

**Implementation Plan:**
- Step 1: Implement subscription flow + admin review + notifications with robust UX.
- Step 2: Integrate terminals through PersonResolver abstraction for later expansion.
- Validation Method: Ensure no lost events and 5вЂ“30s notification latency in pilot usage.

**Risks and Mitigation:**
- Risk 1: Scale with >1000 parents. в†’ Mitigation: outbox/lease, idempotency, and monitoring.
- Risk 2: Legal/compliance unknowns. в†’ Mitigation: keep MVP scope limited and configurable retention.

---
### Decision Record
[2026-01-26 12:29:37] - MVP is single-tenant per school (one instance/DB per school); multi-tenant is a possible future path.

**Decision Background:**
Need to decide tenancy model for MVP scope and delivery speed.

**Available Options:**
- Option 1: Single-tenant per school (separate instance/DB).
  - Pros: Simpler delivery, clear data isolation.
  - Cons: More deployments to manage.
- Option 2: Multi-tenant in one DB.
  - Pros: Centralized operations.
  - Cons: Requires schema changes and tenant isolation logic.

**Final Decision:**
MVP is single-tenant per school to reduce complexity and keep isolation explicit; revisit multi-tenant later if needed.

**Implementation Plan:**
- Step 1: Keep schema and services single-tenant for MVP.
- Step 2: Document multi-tenant as a future enhancement.
- Validation Method: Confirm each school uses a separate instance/DB.

**Risks and Mitigation:**
- Risk 1: Operational overhead for many schools. в†’ Mitigation: automate provisioning later.

---
### Decision Record
[2026-01-26 12:55:37] - Device Service ingestion flow: always provide eventId, batch on recovery then switch to single events, auth required, and direction mapped by Device Service. Event ingestion dedupes by eventId with retry semantics.

**Decision Background:**
Need a reliable ingestion contract that decouples terminal specifics from core system and ensures delivery.

**Available Options:**
- Option 1: Terminals send raw events directly to core.
  - Pros: Fewer services.
  - Cons: Tightly coupled to terminal APIs and reliability issues.
- Option 2: Device Service adapts terminal APIs and sends normalized events to core.
  - Pros: Stable event schema, easier vendor swaps, reliability controls.
  - Cons: Additional service to run.

**Final Decision:**
Use Device Service as the adapter: it always provides eventId, can batch on recovery, and sends normalized events with auth; core dedupes by eventId.

**Implementation Plan:**
- Step 1: Define normalized event schema with eventId and direction.
- Step 2: Implement ingestion endpoint with auth and idempotency on eventId.
- Validation Method: No lost events after restarts; duplicates ignored by idempotency.

**Risks and Mitigation:**
- Risk 1: Missing eventId from terminal APIs. в†’ Mitigation: Device Service synthesizes eventId.
- Risk 2: Burst traffic on recovery. в†’ Mitigation: support batch ingestion and backoff.

2026-01-25 21:55:41 - Initialized decision log.
2026-01-25 22:03:10 - Added decisions for combined worker runner and tsx usage.

---
### Decision Record
[2026-01-29 18:33:33] - MVP scope decision: AdminUI stays local-only; Telegram Mini App works only inside school LAN or via manual port forwarding/tunnel. Cloud Relay/Agent approach deferred beyond MVP.

**Decision Background:**
We need a usable admin experience in MVP without adding cloud infrastructure, public exposure, or complex networking.

**Available Options:**
- Option 1: Build Cloud AdminUI + Relay/Agent now.
  - Pros: access from anywhere, Telegram Mini App works over public web.
  - Cons: adds a new cloud product and security surface beyond MVP scope.
- Option 2: Keep AdminUI local-only; Mini App works only on LAN or via manual tunnel.
  - Pros: simplest MVP, lower security surface, faster to deliver.
  - Cons: no out-of-network access without manual tunneling.

**Final Decision:**
Option 2 for MVP. Cloud Relay/Agent is deferred.

**Implementation Plan:**
- Step 1: Keep AdminUI served locally.
- Step 2: Document that Mini App is only supported on LAN or with manual port forwarding/tunnel.
- Validation Method: Admin UX works within school network without external dependencies.

**Risks and Mitigation:**
- Risk 1: Admins cannot access UI remotely. -> Mitigation: enable manual VPN/tunnel if needed; revisit cloud Relay later.
---
### Decision Record
[2026-01-26 15:31:31] - Decided device integration responsibilities: core is source of truth for person identity and mapping (deviceId+terminalPersonId -> personId), device manager only knows devices/direction; unknown events stored and later linked; auto-create person allowed only if IIN present; device manager never stores IIN.

**Decision Background:**
Need clear ownership of person identity and device mapping to avoid conflicting sources of truth and ensure reliable notification flow.

**Available Options:**
- Option 1: Device manager owns mapping and event enrichment.
  - Pros: Centralized device logic, fewer core queries.
  - Cons: Splits identity ownership, risks desync and incorrect notifications.
- Option 2: Core owns mapping and identity; device manager only normalizes events.
  - Pros: Single source of truth for person identity, consistent domain decisions.
  - Cons: Core must handle unknown events and mapping workflows.

**Final Decision:**
Core owns person identity and device mapping; device manager only normalizes events and knows device direction. Unknown events are stored and linked later. Auto-create person is allowed only when IIN is present, and device manager never stores IIN.

**Implementation Plan:**
- Step 1: Store and dedupe incoming events in core using deviceId + eventId.
- Step 2: Add mapping workflow in core for deviceId + terminalPersonId -> personId, with admin resolution for unknown events.
- Validation Method: Verify unknown events can be linked after mapping updates and notifications remain consistent.

**Risks and Mitigation:**
- Risk 1: Backlog of unknown events. -> Mitigation: admin queue and tooling for mapping resolution.
- Risk 2: Mapping conflicts. -> Mitigation: enforce uniqueness constraints and notify admins on conflicts.

---
### Architecture Decision
[2026-01-26 19:59:32] - Restructured repo into monorepo layout: apps/worker (entrypoints), packages/core, packages/infra, packages/db, packages/test, and updated scripts/config/imports to new paths; added apps/device-service package placeholder and workspace config.

**Decision Background:**
Multiple services are planned (Hono API, device service, Telegram bot, UI, workers) and we need clear boundaries and scalable structure.

**Considered Options:**
- Option A: Keep a single root package with all code in one src tree.
- Option B: Monorepo with apps/ for entrypoints and packages/ for shared layers.
- Final Choice: Option B to align with Clean Architecture and future service expansion.

**Implementation Details:**
- Affected Modules: core, infra, db, worker, tests, tooling config.
- Migration Strategy: Move src/* into packages/* and apps/worker, update import paths, workspace config, and scripts.
- Risk Assessment: path resolution and script drift в†’ mitigated by updating runAll entry paths and workspace scripts.

**Impact Assessment:**
- Performance Impact: none.
- Maintainability Impact: improved modularity and clearer boundaries.
- Scalability Impact: easier to add new services under apps/ and shared code under packages/.

---
### Architecture Decision
[2026-01-26 21:18:57] - Added DeviceService internal package at packages/device with core/infra/device-db modules, separate device DB schema/migrations, device UoW, repos, and usecases, plus device db CLI commands and tests under packages/test/device.

**Decision Background:**
DeviceService needs its own persistence and application layer before HTTP transport is wired.

**Considered Options:**
- Option A: Place device core/infra/db as separate top-level packages.
- Option B: Create a single packages/device package with internal core/infra/device-db modules.
- Final Choice: Option B to keep device modules co-located while staying inside the monorepo.

**Implementation Details:**
- Affected Modules: packages/device/*, packages/test/device/*, drizzle.device.config.ts, root scripts.
- Migration Strategy: Introduce device-db schema and migrations from scratch with separate commands.
- Risk Assessment: Separate DB tooling may drift from core DB; mitigated by dedicated scripts and tests.

**Impact Assessment:**
- Performance Impact: none.
- Maintainability Impact: clearer device boundaries and isolated storage concerns.
- Scalability Impact: easier to extend device service without touching core DB.

---
### Decision Record
[2026-01-26 22:44:48] - Chose Cloud AdminUI + on-prem Agent/Relay architecture for Telegram Mini App access without public inbound ports; agent maintains outbound connection to relay, executes commands against local Core, and syncs data.

**Decision Background:**
Admin Mini App must be reachable from outside the school network, but Core services are on-prem and should not require inbound public ports.

**Available Options:**
- Option 1: Expose Core via public webhook/VPN.
  - Pros: Direct API access.
  - Cons: Network/security complexity for every school.
- Option 2: Cloud AdminUI + relay with on-prem agent (outbound connection).
  - Pros: No inbound ports; works from anywhere; centralized UI.
  - Cons: Requires relay and agent services; eventual consistency.

**Final Decision:**
Use Cloud AdminUI with a relay; on-prem agent maintains outbound connection and proxies commands/data.

**Implementation Plan:**
- Step 1: Define relay protocol (commands, responses, subscriptions).
- Step 2: Implement agent service in school network.
- Validation Method: Admin Mini App can approve a request and see it reflected in local Core.

**Risks and Mitigation:**
- Risk 1: Data latency/eventual consistency. в†’ Mitigation: show sync status and last-updated timestamps.
- Risk 2: Agent disconnects. в†’ Mitigation: reconnect with backoff and local queueing.

---
### Decision Record
[2026-01-26 19:24:39] - Locked Device Service contract decisions: occurredAt is unix ms, API paths are /api/events and /api/events/batch, and auth uses Authorization: Bearer <token> shared per Device Service instance.

**Decision Background:**
Needed to lock the Device Service contract inputs so ingestion can be implemented consistently across services.

**Available Options:**
- Option 1: ISO 8601 timestamps, prefixed paths, and per-device auth tokens.
  - Pros: Human-readable timestamps; explicit resource naming; granular device-level auth.
  - Cons: Extra parsing; longer paths; more token management overhead.
- Option 2: Unix ms timestamps, short `/api/events` paths, and a shared service token.
  - Pros: Compact payload; simple API; minimal auth management.
  - Cons: Less human-readable timestamps; coarser auth scoping.

**Final Decision:**
Use unix ms for `occurredAt`, `/api/events` and `/api/events/batch` paths, and `Authorization: Bearer <token>` shared per Device Service instance.

**Implementation Plan:**
- Step 1: Update the Device Service contract spec with the chosen format and endpoints.
- Step 2: Implement ingestion endpoints in Core following the contract.
- Validation Method: Ingestion tests accept unix ms timestamps and pass auth with service token.

**Risks and Mitigation:**
- Risk 1: Reduced timestamp readability. в†’ Mitigation: log formatting in adapters and admin UI.
- Risk 2: Shared token exposure. в†’ Mitigation: rotate tokens and restrict network access to Core.
---
### Decision Record
[2026-01-27 12:08:04] - Centralize runtime configuration in packages/config with a lightweight .env loader and zod validation; avoid adding dotenv.

**Decision Background:**
Need consistent config handling across workers, device service, and DB tooling without new dependencies.

**Available Options:**
- Option 1: Use dotenv.
  - Pros: standard.
  - Cons: adds dependency.
- Option 2: Implement small .env loader and validate via zod.
  - Pros: no new dependency, typed validation, explicit failures.
  - Cons: less feature-complete parsing.

**Final Decision:**
Use packages/config to load .env and validate typed configs with zod; entrypoints and drizzle configs call loadEnv() before reading config.

**Risks and Mitigation:**
- Risk 1: Partial .env parsing support. -> Mitigation: keep .env simple and document via .env.example.
---
### Decision Record
[2026-01-27 12:34:22] - DB-backed runtime settings layered on top of env config for workers.

**Decision Background:**
Need admin-adjustable settings without adding dependencies or coupling env parsing to DB.

**Available Options:**
- Option 1: Keep env-only configuration.
  - Pros: simple.
  - Cons: cannot adjust at runtime via admin.
- Option 2: Use settings table as DB overrides on top of env defaults.
  - Pros: admin-adjustable, explicit validation in core usecases, no new deps.
  - Cons: overrides apply on service restart (for now).

**Final Decision:**
Keep packages/config env-only and add core settings repo/usecases to read validated overrides from the existing settings table; entrypoints load overrides after DB connection and pass them into config getters.

**Risks and Mitigation:**
- Risk 1: Invalid DB values break startup. -> Mitigation: zod validation in core usecases with explicit errors.
---
### Decision Record
[2026-01-27 12:47:23] - Core owns runtime config types/keys and uses a RuntimeConfigProvider port for admin settings snapshots.

**Decision Background:**
Admin delivery needs env/db/effective settings without violating Clean Architecture boundaries.

**Available Options:**
- Option 1: Core imports packages/config directly.
  - Pros: quick.
  - Cons: crosses layers.
- Option 2: Move types/keys into core and add a provider port implemented in infra.
  - Pros: keeps core pure, reusable for Hono/bot/admin.
  - Cons: slightly more wiring.

**Final Decision:**
Define runtime config types/keys in core (untimeConfig.ts) and introduce RuntimeConfigProvider port; infra implements the port via packages/config and core exposes snapshot usecase for admin layers.
---
### Decision Record
[2026-01-27 13:58:13] - Hono delivery uses composition root, Zod contracts, and request-context logging via middleware.

**Decision Background:**
Need thin handlers that respect Clean Architecture boundaries and can share DTOs with future UI clients.

**Available Options:**
- Option 1: Validate/parse inside each handler.
  - Pros: simple.
  - Cons: handler bloat, repeated parsing logic.
- Option 2: Use middleware for JSON validation, contracts package for DTOs, and composition root DI.
  - Pros: thin handlers, shared contracts, clear boundaries.
  - Cons: requires more wiring.

**Final Decision:**
Introduce packages/contracts for Zod DTOs, add Hono middleware (equestContext, parseJson), and compose routes in createApiApp with injected handlers/services and a pino logger.


---
### Decision Record
[2026-01-27 20:00:28] - Retention runs as a user-level scheduled one-shot task instead of an always-on worker.

**Decision Background:**
Running a dedicated retention worker continuously is unnecessary operational overhead for MVP and complicates scheduling control from admin settings.

**Available Options:**
- Option 1: Keep retention in `runAll` as an always-on polling worker.
  - Pros: simple mental model.
  - Cons: unnecessary background process and harder schedule control.
- Option 2: Provide a one-shot retention entrypoint and register it with OS scheduling per user.
  - Pros: explicit control, lower steady-state overhead, aligns with on-prem constraints.
  - Cons: requires OS-specific scheduling glue.

**Final Decision:**
Use Option 2. Retention is exposed as `retention:run-once` and an OS-aware `retention:schedule:apply` that registers a per-user schedule (Task Scheduler on Windows, crontab on Linux). `runAll` no longer starts retention by default.

**Risks and Mitigation:**
- Risk 1: Cron/task creation may fail due to missing permissions or tools. -> Mitigation: surface explicit errors and keep a manual `retention:worker` fallback.

---
### Decision Record
[2026-01-27 20:17:02] - OS retention scheduling is implemented as an infra ops service reused by CLI and admin API.

**Decision Background:**
We need an admin endpoint to apply retention scheduling without duplicating OS-specific scheduling logic across entrypoints.

**Available Options:**
- Option 1: Keep scheduling logic only in the CLI script and shell out from the API.
  - Pros: minimal refactor.
  - Cons: brittle and duplicates config resolution paths.
- Option 2: Extract scheduling into an infra service and call it from both CLI and API composition roots.
  - Pros: single source of truth, cleaner layering, easier to test via stubs.
  - Cons: requires a small refactor.

**Final Decision:**
Use Option 2. The scheduling logic lives in `packages/infra/src/ops/retentionSchedule.service.ts` and is reused by `retention:schedule:apply` and `/admin/retention/schedule/apply`.

---
### Decision Record
[2026-01-27 20:31:19] - Retention lifecycle admin endpoints reuse the same infra ops service as CLI scheduling.

**Decision Background:**
We need run-once and schedule-remove admin actions without duplicating OS-specific scheduling and retention cleanup wiring.

**Available Options:**
- Option 1: Implement each admin route as its own entrypoint logic.
  - Pros: quick per-route changes.
  - Cons: duplication and drift risk.
- Option 2: Extend the existing retention ops service and reuse it from both CLI and admin routes.
  - Pros: single source of truth, easier stubbing in tests, cleaner boundaries.
  - Cons: requires small refactor in CLI scripts.

**Final Decision:**
Use Option 2. Retention lifecycle actions live in `packages/infra/src/ops/retentionSchedule.service.ts` and are exposed via thin admin routes and CLI scripts.

---
### Decision Record
[2026-01-27 20:51:16] - Monitoring is exposed as a read-only snapshot route backed by a dedicated monitoring repo.

**Decision Background:**
We need operational visibility without leaking ORM details into delivery layers or scattering aggregation logic across routes.

**Available Options:**
- Option 1: Run raw aggregations in the Hono route.
  - Pros: quick.
  - Cons: violates Clean Architecture boundaries.
- Option 2: Add a core monitoring usecase and an infra monitoring repo that aggregates data.
  - Pros: keeps delivery thin, centralizes monitoring logic, easier to evolve.
  - Cons: adds a small amount of wiring.

**Final Decision:**
Use Option 2. Monitoring lives behind `createGetMonitoringSnapshotUC` and `createMonitoringRepo`, and is exposed via `/admin/monitoring`.

---
### Decision Record
[2026-01-28 11:51:40] - Standardize workspace imports to `@school-gate/*` and prepare packages for independent builds.

**Decision Background:**
Cross-package relative imports caused tsconfig rootDir errors and made independent app updates brittle.

**Available Options:**
- Option 1: Use workspace packages with proper exports and build outputs; update imports to `@school-gate/*`.
  - Pros: stable runtime resolution, supports independent app builds.
  - Cons: requires package export and build setup.
- Option 2: Use tsconfig paths with a runtime loader (tsconfig-paths).
  - Pros: faster to set up.
  - Cons: requires new dependency and runtime configuration.

**Final Decision:**
Use Option 1. Added per-package tsconfigs, exports, and build scripts; updated imports to `@school-gate/*` and added workspace deps.

**Implementation Plan:**
- Step 1: Add tsconfig/build scripts and exports for shared packages.
- Step 2: Update imports and add workspace deps in apps/packages.
- Step 3: Add root build:packages scripts and paths for typecheck.

**Risks and Mitigation:**
- Risk 1: Package build order issues in dev watch. -> Mitigation: run `pnpm build:packages` once before watch.

---
### Decision Record
[2026-01-28 21:52:55] - Replace worker runAll with per-entrypoint scripts and concurrently-driven dev:all/start:all.

**Decision Background:**
The custom runAll runner was a single-purpose script that required tests and maintenance, while we now need consistent start/dev flows for multiple apps (workers, device-service, adapters) across Windows and Linux.

**Available Options:**
- Option 1: Keep a custom Node runner per app.
  - Pros: maximum control.
  - Cons: extra code/tests to maintain.
- Option 2: Use `concurrently` to orchestrate per-entrypoint scripts.
  - Pros: minimal code, cross-platform, simpler scripts.
  - Cons: adds a dev dependency.

**Final Decision:**
Use Option 2. Each app exposes per-entrypoint `dev:*`/`start:*` scripts and a `dev:all`/`start:all` orchestrator via `concurrently`.

**Implementation Plan:**
- Step 1: Add per-entrypoint scripts in apps/worker and apps/device-service.
- Step 2: Add `dev:all`/`start:all` using `concurrently`.
- Step 3: Remove `runAll.ts` and its tests.

**Risks and Mitigation:**
- Risk 1: Orchestration output becomes noisy. -> Mitigation: use named processes with colored output.

---
### Architecture Decision
[2026-01-28 23:22:11] - Move device registry out of Core into DeviceService: remove Core /admin/devices and device checks in ingest; add DS admin devices API, new device usecases, and DeviceService Hono server; add name column to device DB schema (requires device:db:generate+migrate). Update tests accordingly.

**Decision Background:**
Device ownership and validation should live in DeviceService to keep Core focused on person mappings and access-event processing. This aligns with the adapter handshake model where adapters register with DS and DS validates device assignments and direction.

**Considered Options:**
- Option A: Keep device registry in Core and validate devices during ingestion.
- Option B: Move device registry to DeviceService and make DS the source of truth.
- Final Choice: Option B, to avoid duplicated ownership and to keep Core agnostic of adapter/device lifecycle.

**Implementation Details:**
- Affected Modules: Core ingest usecase + API routes, DeviceService API (now Hono), device repos/usecases, contracts, tests.
- Migration Strategy: Remove Core /admin/devices and device checks; add DS /admin/devices; keep Core devices table as legacy; add name column to device DB via device:db:generate+migrate.
- Risk Assessment: DS downtime blocks device admin operations; mitigated by running DS alongside Core and monitoring.

**Impact Assessment:**
- Performance Impact: minimal.
- Maintainability Impact: clearer ownership boundaries.
- Scalability Impact: easier adapter expansion and multi-device management in DS.

---
### Architecture Decision
[2026-02-03 17:08:02] - Introduced core services layer for auth/admin with withTx support; added auth types module; updated repo interfaces and infra repos with withTx; refactored auth/admin UCs to use services; updated API composition modules and tests; added core services export.

**Decision Background:**
UCs were directly calling multiple repos, which blurred boundaries and encouraged duplication. We needed a service gate per bounded context while preserving the existing better-sqlite3 sync transaction model.

**Considered Options:**
- Option A: Keep UC→repo access and allow UC-to-UC calls when aggregation is needed.
- Option B: Add a services layer per bounded context and route UC access through services, using repo/service `withTx` for sync transactions.
- Final Choice: Option B to enforce boundaries and keep transaction wiring compatible with current UoW.

**Implementation Details:**
- Affected Modules: `packages/core/src/services/auth`, `packages/core/src/services/admin`, `packages/core/src/usecases/auth`, `packages/core/src/usecases/admin`, `packages/core/src/repos/admin|auth`, `packages/infra/src/drizzle/repos/*`, `apps/api/src/index.ts`, `apps/api/src/app/modules/admin/index.ts`, `packages/test/*`.
- Migration Strategy: Add `withTx` to repo interfaces and infra repos; introduce services with `withTx`; refactor UCs and DI; update tests and exports.
- Risk Assessment: DI wiring mistakes and missing `withTx` in stubs; mitigated by updating tests and interfaces.

**Impact Assessment:**
- Performance Impact: none.
- Maintainability Impact: clearer boundaries and less duplication in UC logic.
- Scalability Impact: easier to add higher-level UCs that aggregate services across contexts.
---
### Architecture Decision
[2026-02-03 19:21:42] - Define IAM bounded context and cross-BC access rules: services per BC, read-only query ports for cross-BC reads, UCs only for cross-BC writes.

**Decision Background:**
Auth/admin/roles/passwords/telegram-link logic is tightly coupled and caused boundary violations and duplication. We need a clearer ownership model while still enabling cross-BC reads without mixing write responsibilities.

**Considered Options:**
- Option A: Keep auth/admin as separate BCs and allow service-to-service dependencies across BC boundaries.
- Option B: Introduce IAM BC for identities + access; keep services inside BC, use read-only query ports for cross-BC reads, and keep UCs for cross-BC writes.
- Final Choice: Option B to reduce boundary leaks while keeping cross-BC reads explicit and non-mutating.

**Implementation Details:**
- Affected Modules: `packages/core/src/iam`, `packages/core/src/ports` (query ports), `packages/core/src/usecases` (cross-BC writes), composition roots and tests.
- Migration Strategy: Move auth/admin/roles/invites/passwords/tg-links into IAM; expose read-only query ports for cross-BC reads; refactor UCs to handle cross-BC writes only.
- Risk Assessment: Refactor size and risk of ports accumulating business logic; mitigate with strict rule that query ports are read-only and behavior-free.

**Impact Assessment:**
- Performance Impact: minimal; potential improvements via optimized read-only queries.
- Maintainability Impact: clearer BC ownership and fewer boundary violations.
- Scalability Impact: easier to extend IAM and to add cross-BC reads without entangling write flows.
---
### Architecture Decision
[2026-02-03 22:15:17] - Refactored core auth/admin into IAM BC with new services/flows, moved auth constants and repos into iam, added query ports under ports/queries/iam, removed auth/admin UC files, updated tests to use IAM services/flows, added compatibility re-exports for old auth/repos paths, added core package exports for iam and query ports.

**Decision Background:**
Auth/admin logic had boundary violations and duplicate UC wrappers. We needed to implement the IAM BC rules in code and align tests to the new service/flow model while keeping compatibility for existing imports.

**Considered Options:**
- Option A: Keep old auth/admin services and add IAM in parallel without refactor.
- Option B: Move auth/admin into IAM, implement services/flows per clean-abc, add compatibility re-exports, and update tests.
- Final Choice: Option B to align core code with the new BC model and reduce boundary violations.

**Implementation Details:**
- Affected Modules: `packages/core/src/iam/**`, `packages/core/src/ports/queries/iam/**`, `packages/core/src/auth/*`, `packages/core/src/repos/*`, `packages/core/src/usecases/auth|admin/*`, `packages/test/**`, `packages/core/package.json`.
- Migration Strategy: Move auth constants/repos into `iam`, introduce IAM services/flows, delete auth/admin UC wrappers, update tests to use IAM flows, keep old auth/repos paths as re-exports for compatibility.
- Risk Assessment: Temporary dual APIs (old services + new IAM) and apps still importing removed UCs; mitigated by compatibility re-exports and planned app refactor.

**Impact Assessment:**
- Performance Impact: none.
- Maintainability Impact: improved BC alignment and clearer ownership.
- Scalability Impact: easier to extend IAM and add query ports.
---
### Architecture Decision
[2026-02-03 22:46:19] - Refined IAM: moved entity types from repos into iam/entities, grouped flows into subfolders (auth/access/admin/telegram), updated query ports to use entity/flow types, updated IAM exports and package.json for new subpaths.

**Decision Background:**
Repository files were carrying entity type definitions used across services and flows, and the flows directory was growing too large to navigate. We needed clearer ownership for entity types and a more discoverable flow layout.

**Considered Options:**
- Option A: Keep entity types in repos and keep all flows in a single folder.
- Option B: Move entity types into iam/entities and group flows by domain subfolder.
- Final Choice: Option B to separate persistence from domain types and improve navigation.

**Implementation Details:**
- Affected Modules: `packages/core/src/iam/entities`, `packages/core/src/iam/repos`, `packages/core/src/iam/flows/**`, `packages/core/src/ports/queries/iam`, `packages/core/package.json`.
- Migration Strategy: Extract entity types into `iam/entities`, update repos/services/ports imports, move flows into domain subfolders, update exports and tests.
- Risk Assessment: Import path drift in tests and ports; mitigated by batch updates and export changes.

**Impact Assessment:**
- Performance Impact: none.
- Maintainability Impact: cleaner separation of domain types and easier flow navigation.
- Scalability Impact: easier to grow IAM without a flat flow directory.

---
### Decision Record
[2026-02-04 00:24:35] - Adopt adjacent `*.types.ts` files for flow/service/usecase types.

**Decision Background:**
Flow/service/usecase input and deps types were embedded inline, making usage harder to scan and maintain.

**Available Options:**
- Option 1: Keep types inline in each flow/service/usecase file.
  - Pros: fewer files.
  - Cons: harder to scan and reuse types; noisy diffs.
- Option 2: Move types into adjacent `*.types.ts` files.
  - Pros: clearer signatures, easier navigation and reuse.
  - Cons: adds small number of files.

**Final Decision:**
Use adjacent `*.types.ts` files for flow/service/usecase types and export them from the BC index when the flow/service is exported.

---
### Decision Record
[2026-02-04 01:16:17] - Flows exist only for multi-service orchestration; single-service operations live on the service (ports allowed).

**Decision Background:**
Single-service flows added unnecessary indirection and duplicated service methods.

**Available Options:**
- Option 1: Keep single-service flows for consistency.
  - Pros: uniform structure.
  - Cons: extra indirection and boilerplate.
- Option 2: Only use flows when coordinating multiple services.
  - Pros: clearer ownership and less noise.
  - Cons: services grow slightly.

**Final Decision:**
Use flows only for multi-service orchestration. Single-service operations (even with ports) are implemented as service methods.

---
### Decision Record
[2026-02-04 02:27:09] - IAM auth uses an auth service with pluggable strategies and refresh-token rotation.

**Decision Background:**
We need multiple login methods and centralized token issuance without spreading repo dependencies across services.

**Available Options:**
- Option 1: Implement logins as separate UCs and issue tokens per UC.
  - Pros: simple per-flow implementation.
  - Cons: duplicated token issuance and harder to add new methods consistently.
- Option 2: Create an auth service (orchestrator) with strategies and centralized token issuing/rotation.
  - Pros: single token policy, pluggable login methods, clear composition.
  - Cons: new auth layer to wire in infra.

**Final Decision:**
Use an auth service in IAM with strategy interface for login methods and a refresh-token rotation policy; refresh tokens are opaque with argon2-hashed secrets stored in DB.

---
### Decision Record
[2026-02-04 03:08:29] - Use PasswordHasher for refresh token hashing and introduce admin tg code purpose.

**Decision Background:**
Refresh token hashing already has a strong password hashing port, and telegram codes need explicit purpose to avoid misuse between linking and login.

**Available Options:**
- Option 1: Keep a separate refreshTokenHasher port and reuse tg link codes for all purposes.
  - Pros: minimal changes.
  - Cons: redundant hashing interfaces, no guardrails on code usage.
- Option 2: Reuse PasswordHasher for refresh tokens and add a purpose field to telegram codes.
  - Pros: fewer ports, clear intent separation between link/login codes.
  - Cons: requires schema rename and migration.

**Final Decision:**
Reuse PasswordHasher for refresh tokens and rename admin tg link codes to admin tg codes with explicit purpose.

---
### Decision Record
[2026-02-04 19:11:06] - Core package exports only the root index; public API is re-exported from `packages/core/src/index.ts`.

**Decision Background:**
We want a single export surface for core and to enforce a consistent, discoverable API.

**Available Options:**
- Option 1: Keep granular subpath exports in package.json.
  - Pros: minimal change, existing imports keep working.
  - Cons: scattered API surface, harder to track public contract.
- Option 2: Export only the root index and re-export modules from there.
  - Pros: single entry point, clearer API surface.
  - Cons: requires adjusting imports over time.

**Final Decision:**
Use Option 2 and export only the root index from `@school-gate/core`.

---
### Decision Record
[2026-02-04 21:36:36] - Refactor runtime settings into a Settings BC with a single SettingsService.

**Decision Background:**
Runtime settings logic lived in usecases even though it only touches the settings repo and runtime config port. This conflicted with the new clean-abc rules where usecases are for cross-BC writes.

**Available Options:**
- Option 1: Keep settings usecases as the public API.
  - Pros: fewer file moves.
  - Cons: violates BC/service rule and encourages UC usage for single-BC logic.
- Option 2: Move settings logic into a SettingsService and remove the usecases.
  - Pros: clean-abc alignment, single write gate, clearer BC ownership.
  - Cons: requires consumers to switch to service API.

**Final Decision:**
Use Option 2: introduce Settings BC with `SettingsService` and remove settings usecases.

---
### Decision Record
[2026-02-04 22:53:34] - Use registry + pipeline for runtime settings parsing and snapshot building.

**Decision Background:**
Runtime settings were parsed and snapshotted via duplicated helper logic, which made extension error-prone when adding new keys.

**Available Options:**
- Option 1: Keep manual per-group parsing and snapshot helpers.
  - Pros: straightforward, no structural change.
  - Cons: high duplication, easy to drift when adding keys.
- Option 2: Introduce a registry of keys and a pipeline (parse → overrides → snapshot).
  - Pros: single extension point, lower duplication, consistent behavior.
  - Cons: additional abstraction and new modules.

**Final Decision:**
Use Option 2 with a settings registry and pipeline, and throw a domain error on invalid values.

---
### Decision Record
[2026-02-04 23:11:14] - Split settings registry into per-group files and centralize validation errors.

**Decision Background:**
The registry grew into a large file and pipeline typing relied on loose `any` usage, which reduced readability and type safety.

**Available Options:**
- Option 1: Keep a single registry file and allow loose typing.
  - Pros: fewer files.
  - Cons: poor readability and weaker type safety as keys grow.
- Option 2: Split registry by domain (group) and export a thin aggregator; tighten pipeline typing and map validation errors to a domain error.
  - Pros: clearer structure, easier navigation, better type discipline.
  - Cons: more files to maintain.

**Final Decision:**
Use Option 2 and add a registry-splitting rule to the mr-propper skill.

---
### Decision Record
[2026-02-04 23:35:06] - Derive SettingsGroup from registry and bind entry types to config selectors.

**Decision Background:**
Manual unions for SettingsGroup and loose value typing in registry entries introduce drift and weaken type safety.

**Available Options:**
- Option 1: Keep SettingsGroup as a manual union and accept loose typing in entries.
  - Pros: simpler types file.
  - Cons: manual drift and weaker compiler guarantees.
- Option 2: Derive SettingsGroup from registry keys and use a helper to bind setOverride value to selectFromConfig return type.
  - Pros: strong typing, no manual union updates.
  - Cons: slightly more indirection.

**Final Decision:**
Use Option 2 to ensure registry types stay aligned with implementation.

---
### Decision Record
[2026-02-05 00:09:02] - Remove settings pipeline dependence on concrete group shapes.

**Decision Background:**
Pipeline functions encoded knowledge of concrete settings groups and snapshot shapes, reducing reuse and type clarity.

**Available Options:**
- Option 1: Keep pipeline aware of RuntimeSettingsSnapshot and RuntimeOverridesByGroup.
  - Pros: simpler return types.
  - Cons: leaks domain structure into pipeline and adds coupling.
- Option 2: Make pipeline generic and map to concrete shapes in the service layer.
  - Pros: pipeline is reusable and minimal; service controls domain shape.
  - Cons: requires explicit mapping in service.

**Final Decision:**
Use Option 2 and keep pipeline generic.

---
### Decision Record
[2026-02-05 00:27:18] - Use registry-driven parsing/serialization for setRuntimeSettings.

**Decision Background:**
Manual validation schemas and per-key mapping in setRuntimeSettings caused duplication and made adding new settings error-prone.

**Available Options:**
- Option 1: Keep manual schemas and explicit key mapping.
  - Pros: straightforward.
  - Cons: duplication, harder to extend.
- Option 2: Add parseInput/serialize hooks to registry entries and let setRuntimeSettings iterate the registry.
  - Pros: single extension point, consistent validation.
  - Cons: requires updating registry entries.

**Final Decision:**
Use Option 2 and centralize setRuntimeSettings around the registry.

---
### Decision Record
[2026-02-05 00:39:40] - Use bivariant helpers for registry entry callbacks to avoid TS2375.

**Decision Background:**
Exact optional property types caused assignability errors between concrete SettingEntry types and generic registry entry types.

**Available Options:**
- Option 1: Keep strict callback types and force explicit casts.
  - Pros: no helper types.
  - Cons: noisy casts, brittle typing.
- Option 2: Use a bivariant callback helper for setOverride/serialize and allow entries to be typed concretely.
  - Pros: clean assignment, maintainable typing.
  - Cons: slightly weaker variance guarantees.

**Final Decision:**
Use Option 2 to keep registry entries type-safe without noisy casts.

- [2026-02-09 22:48:23] Decision: move AdminUI auth from localStorage token persistence to cookie-first session model. Rationale: localStorage tokens are high-risk for XSS exfiltration; cookie-based httpOnly session improves security and preserves auth across reload via server session check. Tradeoff: requires backend endpoints/cookie contract (/api/auth/session, /api/auth/logout, secure Set-Cookie on login/refresh).

- [2026-02-09 23:05:55] Decision: standardize admin-ui interaction states at primitive level (utton, input) and build dashboard list on shadcn table primitives without new dependencies. Rationale: consistent cursor/focus/hover behavior across routes and faster iteration without backend/API changes.

- [2026-02-09 23:32:19] Decision: enforce accessibility and interaction compliance in admin-ui by adding structural a11y primitives (skip-link/main landmark), semantic form autofill metadata, and deterministic UI formatting without changing backend contracts. Rationale: improve keyboard/screen-reader behavior and UX consistency while keeping feature behavior stable.
- [2026-02-09 23:38:06] - [Admin Telegram Link in Bot] Decision: Reuse IAM `linkTelegramByCode` flow directly inside `apps/bot` composition (core+infra wiring) instead of API roundtrip; add session mode switch (`parent`/`admin`) with default parent mode and admin gating by linked `tgUserId`. Rationale: keeps bot latency and failure surface lower, reuses existing domain constraints/errors, and supports dual-role users without new persistence. Alternatives considered: (1) call API `/api/auth/telegram/link-by-code` from bot process, (2) separate admin-only bot process. Chosen approach minimizes moving parts for MVP.

- [2026-02-09 23:49:30] Decision: keep cookie-first auth and fix reload persistence via two layers: local dev cookie-secure config set to false for HTTP localhost, plus frontend session recovery fallback (401 on /session -> /refresh -> retry /session). This avoids hard logout when access cookie expires while refresh cookie remains valid.
- [2026-02-10 04:20:40] Decision: add dev-only backend auth cookie presence tracing at /api/auth/session and /api/auth/refresh (header/cookie presence booleans only, no token values) to debug cross-origin cookie delivery issues safely.
- [2026-02-10 05:18:49] Decision: stop running root auth bootstrap on SSR in admin-ui because current server-side fetch path does not forward inbound browser cookies to API; enforce auth on client guards to preserve HttpOnly cookie flow.
---
### Architecture Decision
[2026-02-10 05:31:35] - Reworked admin-ui auth flow to TanStack Start best-practice server-function session resolution with HttpOnly cookie forwarding and root route context hydration for client useSession. Removed redundant per-route auth requests and centralized auth gating in root beforeLoad.

**Decision Background:**
SSR and client auth checks used direct frontend API calls, which failed to carry browser HttpOnly cookies during server execution and caused false logout/refresh loops.

**Considered Options:**
- Option A: Keep client-only session checks and skip SSR auth checks.
- Option B: Implement TanStack Start server-function based auth session resolution and use root route context as single source of truth.
- Final Choice: Option B, because it keeps secure cookie auth compatible with SSR and avoids duplicated auth requests.

**Implementation Details:**
- Affected Modules: apps/admin-ui/src/lib/auth/session.server.ts, apps/admin-ui/src/routes/__root.tsx, auth service and auth-related routes.
- Migration Strategy: Introduced server function resolver for session/refresh, switched root guard to consume it, and changed child routes to rely on root context session.
- Risk Assessment: Requires correct backend CORS/cookie attributes and stable Set-Cookie forwarding from server function responses.

**Impact Assessment:**
- Performance Impact: Reduced duplicate auth calls by centralizing checks.
- Maintainability Impact: Single auth gate and session source simplifies reasoning.
- Scalability Impact: Supports future protected layout expansion with consistent SSR/CSR behavior.
- [2026-02-10 05:38:19] Decision: make logout deterministic by awaiting server-side /api/auth/logout via TanStack Start server function with cookie forwarding, then clear client session and navigate.
