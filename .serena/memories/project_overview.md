# Project Overview

## Purpose
- School access backend that ingests FaceID terminal events.
- Manages parent subscription requests via Telegram identifiers and links them to persons by IIN.
- Sends entry/exit notifications to parents after admin approval and audit logging.

## Current Scope
- Core domain/usecases, Drizzle schema and repos, SQLite persistence.
- Background workers for pending-request preprocessing and outbox processing.
- No HTTP API or Telegram bot entrypoints found in `src/` yet.

## Tech Stack
- TypeScript (strict), Node.js 20+, pnpm.
- SQLite via better-sqlite3, Drizzle ORM, Zod.
- Vitest for tests, ESLint + @typescript-eslint + @stylistic for linting.
- Planned (per AGENTS.md): Hono (HTTP API/admin backend), telegraf (Telegram bot), UI (web admin/client).

## Codebase Structure
- `src/core`: domain, ports, usecases, errors/utilities.
- `src/infra/drizzle`: adapters implementing repos/ports.
- `src/db`: Drizzle schema and migrations.
- `src/worker`: background workers and outbox processing.
- `src/test`: vitest tests and helpers.

## Entrypoints
- Workers: `src/worker/main.ts`, `src/worker/outbox/main.ts`.
- API/bot entrypoints: not present yet.
