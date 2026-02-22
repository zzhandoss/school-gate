# Style Conventions

## TypeScript
- Strict compiler settings (`tsconfig.base.json`).
- Use ES2022 target and ESNext modules.

## ESLint / Stylistic
- 4-space indentation.
- Double quotes.
- Semicolons required.
- No trailing commas.
- Spaces inside curly braces.
- Prefer consistent type imports.
- Allow unused args prefixed with `_`.

## Architecture / Practices
- Clean Architecture boundaries: core domain is framework-agnostic; infra implements ports.
- Prefer explicit errors over silent fallbacks.
- Avoid comments unless essential (per AGENTS.md).
