# Backend Business-Logic Architecture Rules

Scope: backend business logic only. Not for frontend or library-only work.

## Architecture Rules

- Services live inside their BC and own read/write for that BC.
- Cross-BC reads are handled via read-only query ports.
  - Query ports can read within a BC or across BCs.
  - Query ports must not contain business logic or mutations.
- Cross-BC writes are handled via usecases.
- Avoid service-to-service dependencies across BC boundaries.

## Design Guardrails

- Read-only query ports must stay pure (no writes, no side effects).
- If a cross-BC view is required, prefer a dedicated query port over a BC service.
- If an operation writes across BCs, it must live in a usecase.

## Core Concepts

### Entity
Purpose: Business object with identity and invariants inside a BC.
Responsibilities: Validate invariants, represent domain state, avoid infrastructure concerns.
When to introduce: When a concept has its own lifecycle, identity, or business rules.

### Repository
Purpose: BC-local persistence interface for entities or aggregates.
Responsibilities: Read/write data for the BC, no business decisions, no cross-BC logic.
When to introduce: When an entity or aggregate needs storage or retrieval beyond in-memory.

### Service
Purpose: Write gate for tightly coupled repositories inside a BC.
Responsibilities:
- Own read/write for one repository, or multiple repositories only if they are tightly coupled and the service has exclusive write authority over them.
  - Tightly coupled = same lifecycle, written together, and invalid to update one without the other.
- Enforce business rules for that repository (or tightly coupled set).
- May call other services inside the same BC for read/write collaboration.
- May call query (read) ports for cross-BC reads.
- Exposes its read/write API to other services and to usecases.
When to introduce: When a repository needs a controlled write boundary with business rules.

### Usecase (UC)
Purpose: Cross-BC write orchestration.
Responsibilities: Coordinate services across BCs for write flows, enforce transactional boundaries.
When to introduce: When an operation writes to multiple BCs or requires cross-BC invariants.

### Query (Read) Port
Purpose: Read-only interface for data retrieval that may cross BC boundaries.
Responsibilities: Provide projections or views, no side effects, no business logic.
When to introduce: When a service or UC needs data outside its BC or needs optimized read models.

## Bounded Context Rules

### How to define a BC
- A BC owns a cohesive set of business concepts with the same reason to change.
- A BC should have a clear source of truth for its entities.
- If two areas constantly change together, they likely belong in the same BC.
- If an area has its own rules, lifecycle, and invariants, it deserves its own BC.

### What lives inside a BC
- Entity definitions and domain rules.
- Repo interfaces for that BC's persistence.
- Services that read/write within that BC.
- Internal flows that aggregate operations only inside the BC.
- BC-local types.

### What does not live inside a BC
- Cross-BC write orchestration (usecases only).
- Cross-BC read projections (query ports only).
- Infra implementations (repositories, DB adapters, external clients).

### Folder structure inside a BC
- entities/ (optional): core types and invariants
- repos/: repo interfaces for this BC
- services/: service per entity or feature cluster
- flows/: aggregation inside the BC (optional)
- types.ts: shared BC types (optional)
- index.ts: public API for the BC (exports services/types/ports)

### Types organization
- Move flow/service/usecase input/output/deps types into adjacent `*.types.ts` files.
- Keep types next to the flow/service/usecase they describe (no central types bucket).
- Export `*.types.ts` from the BC `index.ts` when the flow/service is exported.

### Splitting inside a BC
- If a sub-area has its own reason to change, create a subfolder.
- Subservices may depend on other services only within the same BC.
- Prefer small services + index exports over giant monolith services.

## File Count Rule

- If a folder for a BC component (flows/services/repos/entities) grows beyond 10 files, group files into subfolders by domain/sub-area.
- Start with min 2 subfolders. If a subfolder grows beyond 10 files, split further into more subfolders, and continue as needed.
- Group strictly by domain in the most developer-friendly way.
- Example names: auth, access, admin, telegram, invites, passwords, roles.
## Flow Usage Rule

- Flows are used only when coordinating more than one service inside the same BC.
- If an operation touches only one service (ports allowed), put it on that service instead of creating a flow.
