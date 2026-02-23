# Production Readiness Tracker

Last updated: 2026-02-23
Owner: platform
Status legend: `todo` | `in_progress` | `blocked` | `done`

## Scope

- Deployment model: native services.
- Supported OS: Ubuntu 22.04, Windows 10/11.
- Release platform: GitHub Releases.
- Release artifacts: `source zip` + `prebuilt zip` + `SHA256SUMS`.
- Release trigger: manual git tag `vX.Y.Z`.

## Critical blockers (current baseline)

- `blocked` CI parity issue: GitHub `CI` workflow on `main` still fails on `Test` step, while local `pnpm test` is green.

## P0 Checklist

| ID | Item | Status | Definition of done | Evidence |
|---|---|---|---|---|
| P0-01 | Git initialized and remote configured | done | Local git repo exists, `origin` points to GitHub URL | local git config |
| P0-02 | Repository hygiene files | done | `.gitignore` and `.gitattributes` are committed | repo files |
| P0-03 | Secrets removed from tracked templates | done | `.env.example` contains placeholders only | `.env.example` |
| P0-04 | Root stable commands contract | done | `pnpm dev` and `pnpm build` exist in root scripts | `package.json` |
| P0-05 | Changesets configured | done | `@changesets/cli` installed and `.changeset/config.json` exists | lockfile + config |
| P0-06 | CI workflow added | done | lint/typecheck/test/build workflow exists | `.github/workflows/ci.yml` |
| P0-07 | Release workflow added | done | tag-based workflow builds and publishes source+prebuilt zips | `.github/workflows/release.yml` |
| P0-08 | Runbook baseline added | done | deploy + operations + troubleshooting docs exist | `docs/runbook/*` |
| P0-09 | Linux ops scripts baseline | done | start/stop/restart/status/logs/health scripts exist | `ops/linux/*` |
| P0-10 | Windows ops scripts baseline | done | start/stop/restart/status/logs/health scripts exist | `ops/windows/*` |
| P0-11 | First secure push to GitHub | done | `main` branch pushed and visible in remote repo | GitHub repo |
| P0-12 | First release tag smoke test | done | Tag `vX.Y.Z` creates release with two zips and checksums | `v1.0.2` release assets |

## P1 Readiness (after P0)

| ID | Item | Status | Definition of done |
|---|---|---|---|
| P1-01 | Service unit hardening | todo | Linux systemd and Windows services have restart policy and env wiring |
| P1-02 | Admin UI production proxy | todo | Nginx/Caddy config validated for static + API reverse proxy |
| P1-03 | Rollback procedure | todo | Runbook includes tested rollback between two releases |
| P1-04 | Secrets rotation complete | todo | All production tokens rotated and stored in secret manager |
| P1-05 | Monitoring smoke checks | todo | health endpoints + logs are validated in post-deploy checklist |

## Release artifact contract

- `school-gate-vX.Y.Z-source.zip`: source code archive from tagged commit.
- `school-gate-vX.Y.Z-prebuilt.zip`: built `dist` artifacts + operational files.
- `SHA256SUMS`: checksums for both zip files.

## Required commands for readiness gate

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Current status: all four commands pass on local baseline (2026-02-23).

## Next actions

1. Create a fresh release tag (`vX.Y.Z`) and verify GitHub Release artifacts (`source zip` + `prebuilt zip` + `SHA256SUMS`).
2. Resolve CI/Linux `pnpm test` failure on GitHub Actions to keep release and mainline verification aligned.
3. Validate deployment from release ZIPs on both target OS baselines (Windows 8+ compatible host, Ubuntu 18+ compatible host) using runbook commands.
4. Attach smoke-check evidence to runbook/tracker (service restart, health checks, and rollback rehearsal).
