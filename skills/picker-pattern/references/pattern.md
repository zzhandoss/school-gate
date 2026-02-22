# Design Pattern Rules (Composition-first)

Scope: choosing and applying design patterns for extensibility using composition.  
Not for global architecture design.

## Core Principles

- Composition over inheritance
- Open/Closed principle
- Dependency inversion
- Single responsibility

Patterns are **implementation-style agnostic**:  
class-based and function-based implementations are equivalent.  
Prefer function creators if project uses functional composition style.

## Pattern Selection Framework

### Step 1: Analyze

Identify:
- **Volatility** — what will change?
- **Variation point** — where will new logic be added?
- **Growth vector** — more types? more providers? more steps? more states?

### Step 2: Classify

| Category | Signal | Pattern |
|----------|--------|---------|
| A | Multiple algorithms/behaviors | Strategy |
| B | Stateful lifecycle / statuses | State |
| C | Multiple providers/integrations | Adapter (+ Factory/Registry) |
| D | Step-by-step processing | Pipeline / Chain of Responsibility |
| E | Hide complex subsystem | Facade |

## Categories

### A. Growing Behavior Variants

**Symptoms**
- switch/if by type/status/mode
- branching logic growing

**Pattern**
- Strategy (+ Registry)

**Extension hook**
Add new strategy implementation.

### B. Stateful Workflow

**Symptoms**
- status machine
- transitions based on events

**Pattern**
- State

**Extension hook**
Add new state handler.

### C. Multiple Providers / Integrations

**Symptoms**
- different APIs, SDKs, devices
- incompatible interfaces

**Pattern**
- Adapter (+ Factory/Registry)

**Extension hook**
Add new adapter.

### D. Processing Pipeline

**Symptoms**
- sequential steps
- steps become optional/reusable

**Pattern**
- Chain of Responsibility / Pipeline

**Extension hook**
Add new step.

### E. Hide Complex Subsystem

**Symptoms**
- one public call orchestrates many operations

**Pattern**
- Facade

**Extension hook**
Extend internal orchestration.

## Composition Checklist

Before finalizing:

- [ ] No inheritance for behavior
- [ ] No multi-place switch/if trees
- [ ] Contract/interface exists
- [ ] Implementations are separate
- [ ] Selection/composition point exists
- [ ] New variant can be added without modifying old logic

## Anti-Patterns

Avoid:
- God objects
- Deep inheritance trees
- Singleton/global state
- Provider logic mixed with domain logic
- Temporary flags for behavior switching

## Decision Tree

```txt
Start
│
├─ Need different behaviors? → Strategy
│
├─ Need states/transitions? → State
│
├─ Need multiple providers? → Adapter
│
├─ Need step-by-step processing? → Pipeline
│
└─ Need to hide complexity? → Facade
```

## Best Practices
- Identify variation points early.
- Implement first variant simply.
- Add second variant to validate abstraction.
- Keep dependencies explicit.
- Document extension point.
- Prefer adding code over modifying code.

## Code Review Questions
- Can a new variant be added without modifying existing logic?
- Is the abstraction aligned with the domain concept?
- Are dependencies injected?
- Is behavior composed, not inherited?
- Is the extension point obvious?

## Summary
Good extensible code:
- has a clear variation point,
- models it as a pattern,
- implements it via composition,
- allows extension by adding new components.

Patterns are tools, not goals.
Choose the smallest pattern that supports expected growth.