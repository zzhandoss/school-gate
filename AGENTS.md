# Project Agent Rules

This file defines how the AI agent should work with THIS project.
It complements the global rules from ~/.codex/AGENTS.md.
If there is a conflict, THIS file wins.

---

## 0) Project Metadata

- Project type: monorepo
- Primary language(s): TypeScript
- Runtime(s): Node.js 20+
- Package manager: pnpm
- Frameworks: 
- - Hono (planned HTTP API / admin UI backend) 
- - telegraf (Telegram Bot)
- Database(s): 
- - SQLite(via Drizzle ORM & better-sqlite3 adapter)
- Message broker / queues (if any): 
- - Outbox pattern implemented on SQLite
- Test framework:
- - vitest
- Linter / formatter:
- - eslint
- - stylistic
- CI:
- - not yet

---

## 1) Commands

These commands should exist (or be created) and must stay stable:

- Install: pnpm i
- Dev: pnpm dev
- Lint: pnpm lint
- Lint fix (if available): pnpm lint:fix
- Typecheck: pnpm typecheck
- Test: pnpm test
- Build: pnpm build

If commands are missing, propose a minimal set and add them safely (after plan + approval).

If lint fails:
- Prefer running an auto-fix command (e.g. `lint:fix`) if available.
- Do not manually fix formatting or style issues unless auto-fix is not possible.
- Treat lint errors as tooling issues first, not logic issues.
---

## 2) Architecture Default: Clean Architecture (Mandatory)

Unless explicitly overridden, use Clean Architecture principles.

### Backend (default)
- Domain is pure: no frameworks, no DB clients, no HTTP concerns.
- Use cases / application layer orchestrates domain and ports.
- Infrastructure implements ports/adapters (DB, HTTP clients, queues, etc.).
- Delivery (HTTP/WS/gRPC/Jobs) is a thin layer: validation + mapping + calling use cases.

### Frontend (default)
- Separate UI from business logic:
    - UI components should stay dumb where possible.
    - Application logic lives in services/hooks/state modules (depending on stack).
- Prefer explicit boundaries:
    - pages/routes (delivery)
    - features (use cases)
    - entities (domain)
    - shared (common libs)
- Avoid tightly coupling UI components to API client details.

### Mobile (default)
- Keep UI layer thin and predictable.
- Domain/application logic independent from platform UI toolkit.
- Use adapters for storage, networking, device APIs.
- Prefer testable state management and predictable side effects.

### Libraries (default)
- Stable public API.
- Strict separation between public exports and internal modules.
- Avoid leaking internal types.
- Backward compatibility is important: avoid breaking changes without explicit approval.

If architecture is unclear:
- propose 2–3 architecture options
- write a small architecture note into Memory Bank (see section 3)
- proceed iteratively

---

## 3) Context Tracking: Memory Bank (Mandatory)

We maintain project context, decisions, and progress using the Memory Bank MCP.
This is required to keep long-running architecture work consistent.

### 3.1 Memory Bank Startup Routine (every session)
Before starting any task:
1) Check if the `memory-bank/` directory exists in the project root.
2) If it exists:
    - Use MCP: `get-memory-bank-info` and read the Memory Bank content.
3) If it does NOT exist:
    - Use MCP: `init-memory-bank` to create it.
4) Follow the MCP guidance to maintain Memory Bank files.

### 3.2 Memory Bank Update Routine (after work)
After completing tasks or a meaningful work chunk:
- Use MCP: `update-memory-bank` to record:
    - what changed
    - why it changed
    - decisions made
    - next steps / open questions
    - any risks or TODOs

### 3.3 Fallback if MCP is unavailable
If Memory Bank MCP commands are not available or fail:
- Create and maintain a local `memory-bank/` directory manually (Markdown).
- Use the following minimal structure:

memory-bank/
- README.md                  (how this memory bank is organized)
- CONTEXT.md                 (current state + active focus)
- DECISIONS.md               (architecture decisions / ADR-style notes)
- CHANGELOG.md               (high-level changes by date)
- TODO.md                    (next actions / open questions)

Rules for manual Memory Bank:
- Each decision entry must include: date, decision, rationale, alternatives considered.
- CONTEXT.md must always describe:
    - current goal
    - current constraints
    - key modules involved
    - current known risks

Do not invent history. If unsure, ask the user.

---

## 4) MCP Tooling Policy (Mandatory)

Use the following MCP tools explicitly and intentionally:

### 4.1 Codebase navigation & edits: Serena
- Use Serena to:
    - understand project structure
    - locate relevant modules
    - trace dependencies
    - avoid editing the wrong layer
- Prefer Serena-driven discovery over guessing.

### 4.2 External library knowledge: Context7
- Use Context7 when:
    - using unfamiliar libraries
    - dealing with version-specific APIs
    - writing code that depends on framework conventions
- Prefer official docs and stable sources.

### 4.3 Context persistence: Memory Bank
- Use Memory Bank for:
    - decisions
    - architecture direction
    - invariants
    - “why we did it this way”

Never rely on “chat-only memory” for long projects.

---

## 5) Testing Policy (Mandatory)

### 5.1 When to write tests
- Any new behavior must be covered by tests.
- Any bug fix must include a regression test.
- Refactors that change behavior boundaries require updated tests.

### 5.2 What good tests look like
- Tests must verify real behavior and invariants.
- Prioritize:
    - edge cases
    - error paths
    - boundary conditions
    - concurrency/race conditions (if applicable)
- Avoid tests that only mirror implementation details.

### 5.3 Edge case checklist (use when relevant)
- null/undefined/empty values
- invalid inputs / schema failures
- permission/auth boundaries
- pagination limits / off-by-one
- timezones / date boundaries
- retries / idempotency
- partial failures (network, DB, cache)
- ordering guarantees (events/messages)

### 5.4 Running tests
- If the environment allows running commands, run tests after changes.
- If tests fail, fix the underlying issue (do not weaken tests to make them pass).

---

## 6) Documentation Policy

- Important decisions and architecture changes must be recorded in Memory Bank (DECISIONS.md).
- Keep documentation short and practical.
- Prefer documenting:
    - invariants
    - boundaries
    - public APIs
    - how to run/check the project

---

## 7) Danger Zone (Requires Explicit Approval)

Before doing any of the following, ask the user explicitly:
- adding dependencies
- deleting files/directories
- moving or renaming key modules
- changing public APIs/contracts
- major version upgrades
- destructive DB changes
- CI/CD changes

---

## 8) Open Questions (Fill In or maintain in Memory Bank)

- (list unknowns here, or keep them in memory-bank/TODO.md)
