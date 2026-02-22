---
name: clean-abc
description: Backend business-logic architecture rules for bounded contexts, services, repositories, usecases, and read-only query ports. Use when changing backend business logic; not for frontend or library-only work.
---

# Backend BC Architecture

Apply these rules only when implementing or changing backend business logic.
Do not apply to frontend or library-only work.

## How to use this skill

- Read `references/architecture.md` for the rules and definitions.
- Apply the definitions and boundaries when designing services, repos, UCs, and query ports.
- If a choice is ambiguous, surface it and ask for direction.

## File Count Rule

- If a folder for a BC component (flows/services/repos/entities) grows beyond 10 files, group files into subfolders by domain/sub-area.
- Start with 2 subfolders. If a subfolder grows beyond 10 files, split further into 4 subfolders, and continue as needed.
- Group strictly by domain in the most developer-friendly way.
- Example names: auth, access, admin, telegram, invites, passwords, roles.