---
name: picker-pattern
description: Design pattern selection rules focused on extensibility via composition. Use when implementing or refactoring logic that may gain new variants, providers, steps, or behaviors.
---

# Design Pattern Selection (Composition-first)

Apply this skill only when implementing or refactoring logic that:
 - may gain new variants,
 - may gain new implementations,
 - may need to be extended without rewriting existing code.

## Do NOT apply this skill to:
- pure UI/layout work,
- trivial one-off scripts,
- low-level utility functions with no variation.

## How to use this skill
- Read `references/pattern.md` for pattern rules and selection framework.
- Identify the variation point in the task.
- Select one primary pattern (you can combine several if they match, but do not overcomplicate).
- Implement using composition and complement user style.

If pattern choice is ambiguous, surface it and ask for direction.

## Hard Rules
- Prefer composition over inheritance.
- Depend on interfaces/contracts, not concrete implementations.
- Adding a new variant should not require editing existing logic.
- Do not redesign global architecture — apply pattern locally. But you can suggest global redesign, if its make sense.

## When to apply

Use this skill when:
- user says: “make it extensible”, “we will add more types later”, “design for growth”
- code contains:
  - branching by type/status/mode,
  - provider-specific logic,
  - step-by-step processing,
  - complex orchestration logic,
  - duplicated conditional logic.

## Output format (mandatory)

When applying this skill, output:

```txt
Detected category: A | B | C | D | E
Chosen pattern: <pattern>
Composition hook: <where new variant is added>
Why minimal: <why this pattern is sufficient>