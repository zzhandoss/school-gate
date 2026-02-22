---
name: mr-propper
description: Improve code readability, maintainability, SRP, naming, typing, and testability. Use when asked to make code cleaner/clearer, improve maintainability/readability/testability, refactor, split modules, improve DX, or when creating new functionality with an eye toward future growth and user’s code style.
---

# Mr Propper — Code Cleanliness & Maintainability

Apply this skill when creating or refactoring code to improve readability, structure, naming, typing, and testability.
Respect the existing project style and conventions.

## Core Goals
- Clear intent in names and structure
- Single responsibility per module
- Strong, explicit typing
- Testable, modular design
- Future‑ready without over‑engineering

## Workflow
1. Scan current structure and style (naming, folder layout, file size, typing, tests).
2. Identify the smallest set of changes that improves clarity and SRP.
3. Propose a minimal, structured refactor plan.
4. Implement with consistent style and explicit types.
5. Add/update tests for new or changed behavior.

## Heuristics

### Naming
- Use domain terms, avoid abbreviations.
- Functions are verbs, types are nouns.
- Prefer explicit names over clever ones.

### Structure
- One responsibility per file/module.
- Keep files under 300 lines; split by domain or sub‑area.
- Co‑locate types with the logic they describe.
- If a registry/definition file grows large, split registrations into per‑domain files and keep a thin index that aggregates them.

### Typing
- Prefer explicit input/output types.
- Avoid `any`, prefer union/enum for states.
- If a type is shared, export it from the closest module boundary.
- Derive literal unions from source objects (`keyof typeof`) instead of manually maintaining unions.

### Testability
- Add tests for new behavior and edge cases.
- Avoid testing implementation details.
- Keep dependencies injectable where possible.

### Future‑proofing
- Anticipate likely extensions and design for adding new variants.
- Prefer composition over branching by type/status.
- Avoid global/shared mutable state.

## Coordination With Other Skills
- If a domain‑specific architecture skill is active, follow its rules first.
- This skill focuses on cleanliness, naming, structure, and testability.
