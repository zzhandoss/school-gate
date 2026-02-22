# Product/UI Backlog

Last updated: 2026-02-13

## Rules

1. This file stores only active and planned work. Do not duplicate completed tasks here.
2. Every task must include:
   - Module
   - Location (app/package/path)
   - What to build
   - Priority
   - Status
3. Use statuses:
   - `todo`
   - `in_progress`
   - `blocked`
4. Keep tasks small and implementation-ready. Split large initiatives into multiple entries.
5. When task is done, move it out of this file and record completion in `memory-bank/progress.md`.
6. Prefer grouping by product module (Auth, Dashboard, Persons, Access Events, etc.).

## Task Template

- `[status]` Module: `<name>`
  - Location: `<path or service>`
  - Task: `<clear expected result>`
  - Priority: `P0 | P1 | P2`
  - Notes: `<optional>`

## Backlog

- `[todo]` Module: `Admin UI Navigation`
  - Location: `apps/admin-ui/src/components/app/app-shell.tsx`
  - Task: Add visual indicator for current permission scope (read-only vs manage) per module.
  - Priority: `P2`
  - Notes: Should reuse session permissions already available in store.

- `[todo]` Module: `Global Statistics`
  - Location: `apps/api/src/composition/features/*`, `apps/admin-ui/src/components/*`
  - Task: Expose and show global totals/metrics (not only visible page counts) for modules like subscription requests, access events, persons, etc.
  - Priority: `P1`
  - Notes: Separate "total in system" from "currently loaded".

- `[todo]` Module: `Dashboard Redesign`
  - Location: `apps/admin-ui/src/routes/dashboard.tsx`, `apps/admin-ui/src/components/dashboard/*`
  - Task: Rework dashboard information architecture and visuals; prepare space for useful infographics and future personalization.
  - Priority: `P2`
  - Notes: User marked as medium priority.

- `[todo]` Module: `Tooltip Cleanup`
  - Location: `apps/admin-ui/src/components/**/*`
  - Task: Replace long inline helper texts with shadcn tooltip + info icon where it improves UI clarity.
  - Priority: `P2`
  - Notes: Apply selectively; avoid tooltip overuse.

- `[todo]` Module: `Subscription Requests Table Polish`
  - Location: `apps/admin-ui/src/components/subscription-requests/subscription-requests-table.tsx`
  - Task: Move large resolution hints into tooltips, reduce row visual noise, and redesign action buttons for compact layout (vertical stack, consistent button sizes, color semantics).
  - Priority: `P1`
  - Notes: Keep accessibility labels for icon/text combos.

- `[todo]` Module: `Monitoring Page`
  - Location: `apps/admin-ui/src/routes/monitoring.tsx`, `apps/admin-ui/src/components/monitoring/*`
  - Task: Add standalone monitoring page (separate from dashboard widgets).
  - Priority: `P1`
  - Notes: Reuse existing monitoring APIs and permission checks.

- `[todo]` Module: `DS Module Expansion`
  - Location: `apps/admin-ui/src/routes/devices*`, `apps/api/src/delivery/http/routes/deviceServiceProxy.routes.ts`
  - Task: Expand Device Service UI/API capabilities beyond current CRUD/monitoring baseline.
  - Priority: `P2`
  - Notes: Scope to be split into concrete sub-tasks after API review.

- `[todo]` Module: `DS Monitoring Accuracy`
  - Location: `apps/device-service/src/api/composition/features/monitoring/*`, `packages/core/src/monitoring/*`, `apps/api/src/composition/features/monitoring.feature.ts`, `apps/admin-ui/src/components/devices/device-monitoring-view.tsx`
  - Task: Extend monitoring snapshots with clearer diagnostic fields (age, status reason, pending breakdown) and keep DS and global monitoring snapshots aligned.
  - Priority: `P1`
  - Notes: Deferred from current device settings schema iteration.

- `[todo]` Module: `Bot Parent Registration Phase`
  - Location: `apps/bot/src/*`, `apps/api/src/composition/features/subscriptionRequests.feature.ts`, `packages/contracts/src/*`
  - Task: Add explicit parent registration step in bot start flow to capture requester identity context and phone contact before creating subscription requests.
  - Priority: `P1`
  - Notes: Use Telegram stable identifier `ctx.from.id`; store/display `username`, `first_name`, `last_name` when available; request phone via Telegraf reply keyboard `Markup.button.contactRequest(...)` and read `ctx.message.contact.phone_number` (+ contact `user_id` for self-check).

- `[todo]` Module: `Persons Tagging`
  - Location: `packages/core/src/identities/*`, `packages/db/src/schema/*`, `apps/api/src/delivery/http/routes/persons.routes.ts`, `apps/admin-ui/src/components/persons/*`
  - Task: Add person tags feature so admins can label/segment persons for operational workflows and better UI context.
  - Priority: `P1`
  - Notes: Include CRUD for tags and person-tag assignment in API/UI.

- `[todo]` Module: `Tag-Scoped Permissions for Persons & Access Events`
  - Location: `packages/core/src/iam/*`, `apps/api/src/middleware/*`, `apps/api/src/composition/features/persons.feature.ts`, `apps/api/src/composition/features/accessEvents.feature.ts`
  - Task: Extend roles/permissions to support read/write scoping by person tags, including related access events visibility/edit boundaries.
  - Priority: `P1`
  - Notes: Requires design spike for authorization model (policy shape, fallback behavior, multi-tag semantics).

- `[todo]` Module: `Persons Bulk Import & Adapter Export`
  - Location: `apps/admin-ui/src/components/persons/*`, `apps/api/src/delivery/http/routes/persons.routes.ts`, `packages/device/infra/src/http/deviceAdapterHttpClient.ts`, `apps/adapters/*`
  - Task: Design and implement persons bootstrap flows: upload persons from file and/or adapter-side `fetchIdentities` endpoint to pull all terminal identities, then import into system with review/apply step.
  - Priority: `P1`
  - Notes: Keep idempotent import behavior and clear duplicate handling.
