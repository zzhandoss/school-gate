# Backup Policy

Last updated: 2026-03-06
Owner: platform
Status: draft

## Purpose

This document defines the backup, restore, and verification policy for the current product.

The policy is split into two operating modes:

- `Current mode`: what must be implemented and operated now, without installer/supervisor.
- `Target mode`: what should be automated after installer/supervisor exists.

The project currently uses at least two SQLite databases:

- core database via [drizzle.ts](/C:/Users/User/Desktop/STALKER/packages/db/src/drizzle.ts)
- device-service database via [drizzle.ts](/C:/Users/User/Desktop/STALKER/packages/device/device-db/src/drizzle.ts)

Both use WAL mode. That is a reasonable baseline for single-node durability, but it is not a backup strategy.

## Recovery Targets

Recommended targets for this product:

- `RPO`: up to 1 hour
- `RTO`: up to 30-60 minutes

If an installation cannot meet these targets, that must be explicitly documented for that customer deployment.

## Backup Scope

The backup scope is the full product state required to restore a working installation.

Mandatory:

- core SQLite database
- device-service SQLite database
- runtime configuration and secrets
- license files
- service configuration or supervisor state, if present
- external adapter state, if the adapter stores local DB/config/files

Optional:

- recent log files for diagnostics

Explicitly excluded:

- release bundles
- `dist`
- `node_modules`
- temporary files
- caches

## Backup Types

This policy distinguishes two different artifacts:

- `restore backup`: required to restore product state
- `support bundle`: optional diagnostic package for troubleshooting

Rules:

- Logs are not part of the minimum restore backup scope.
- Logs may be attached to a restore backup as optional diagnostics.
- A support bundle may include logs without being a valid disaster recovery artifact.

## Consistency Rules

Backups must be consistent across all stateful components.

Rules:

- Do not treat `app.db` alone as a valid full backup.
- If device-service has its own DB, it must be backed up together with the core DB.
- If the external adapter stores its own state, that state must be included in the same restore point.
- Config, secrets, and license must belong to the same restore point as the databases.

If a restore point does not include all required state, it must be considered partial and unsupported for disaster recovery.

## Current Mode: Without Installer or Supervisor

This section defines the minimum acceptable policy for the product as it exists today.

### Required Backup Schedule

Implement and operate:

- `Nightly full product backup`
- `Mandatory pre-update backup`

Current script entrypoints:

- Linux:
  - `ops/linux/backup-create.sh`
  - `ops/linux/backup-verify.sh`
  - `ops/linux/backup-prune.sh`
  - `ops/linux/backup-restore.sh`
- Windows:
  - `ops/windows/backup-create.ps1`
  - `ops/windows/backup-verify.ps1`
  - `ops/windows/backup-prune.ps1`
  - `ops/windows/backup-restore.ps1`

Nightly full product backup:

- once per day during a low-traffic window
- stop all product processes in a controlled order
- copy both SQLite DBs
- copy config and secrets
- copy license files
- restart services
- run healthcheck

Mandatory pre-update backup:

- before every release deployment
- must be created even if nightly backup already exists
- must be retained separately from regular nightly rotation

### Why stop services in current mode

Without a dedicated backup orchestrator, the safe and boring approach is:

- stop writers
- capture files
- restart

This avoids pretending that plain file copy on live WAL databases is enough for recovery.

### Current Retention

Recommended retention in current mode:

- keep last `14` nightly backups
- keep last `3` pre-update backups

If storage allows, prefer:

- `30` nightly backups
- `7` pre-update backups

Recommended log attachment retention:

- if logs are attached to backups, keep only recent logs
- prefer `1 current + up to 3 rotated` log files per service
- do not attach full historical log directories to every backup

Current env knobs:

- `BACKUP_DIR`
- `BACKUP_LICENSE_DIR`
- `BACKUP_INCLUDE_LOGS`
- `BACKUP_LOGS_MAX_FILES`
- `BACKUP_KEEP_NIGHTLY`
- `BACKUP_KEEP_PREUPDATE`

### Current Backup Layout

Windows example:

```text
C:\school-gate\
  backups\
    nightly\
      2026-03-06T020000Z\
        manifest.json
        checksums.txt
        core\
        device-service\
        config\
        license\
        adapter\
    pre-update\
      2026-03-06T153000Z-v1.1.0-to-v1.2.0\
        manifest.json
        checksums.txt
        ...
```

Linux example:

```text
/opt/school-gate/
  backups/
    nightly/
      2026-03-06T020000Z/
        manifest.json
        checksums.txt
        core/
        device-service/
        config/
        license/
        adapter/
    pre-update/
      2026-03-06T153000Z-v1.1.0-to-v1.2.0/
        manifest.json
        checksums.txt
        ...
```

### Current Manifest Requirements

Every backup directory must contain:

- `manifest.json`
- `checksums.txt`

`manifest.json` should include at least:

- backup type: `nightly` or `pre-update`
- createdAt
- product version, if known
- host name
- list of included components
- DB file paths used as source
- config path
- license path
- adapter path, if included

`checksums.txt` must include checksums for all copied files.

### Current Restore Procedure

Restore must follow this order:

1. Stop all product services.
2. Take a safety copy of the broken current state before overwriting anything.
3. Restore core DB.
4. Restore device-service DB.
5. Restore config and secrets.
6. Restore license files.
7. Start services.
8. Run healthcheck.
9. Validate application login and one end-to-end operational path.

If schema version and release version do not match, do not continue with partial recovery. Use the restore point together with the matching release version.

### Current Verification Policy

Minimum:

- verify checksums after each backup
- log backup success or failure
- run a restore rehearsal at least once per month

Better:

- weekly restore rehearsal to a separate folder or separate host

A backup that has never been tested by restore is not considered reliable.

## Target Mode: After Installer or Supervisor Exists

This section defines the desired automated policy once installer/supervisor is implemented.

### Required Backup Schedule

Target schedule:

- `Hourly online DB backup`
- `Nightly full product snapshot`
- `Mandatory pre-update snapshot`

Hourly online DB backup:

- every hour
- SQLite-aware backup path
- covers core DB and device-service DB separately but under one logical restore point

Nightly full product snapshot:

- once per day
- short controlled quiesce of all product processes
- includes DBs, config, license, supervisor state

Mandatory pre-update snapshot:

- created by installer/supervisor automatically before applying update
- rollback path must know exactly which snapshot belongs to which upgrade attempt

### Target Retention

Recommended target retention:

- `48` hourly backups
- `30` daily backups
- `12` monthly backups
- `7` pre-update snapshots

### Target Storage Policy

Recommended:

- one local copy on the host
- one secondary copy on separate storage
- encrypted backups if they leave the host

If possible, follow a `3-2-1` strategy:

- 3 copies
- 2 storage locations
- 1 copy off the main host

### Target Restore UX

Installer/supervisor should eventually support:

- `Backup now`
- `List backups`
- `Validate backup`
- `Restore from backup`
- `Show last successful backup`
- `Show last restore test`

The default operator flow should not require manual `.env` editing or raw file copying.

## Policy for Updates

This policy must hold in both current and target mode:

- no update without a backup created immediately before update
- no destructive overwrite of state without a restore point
- every update must have a rollback note referencing the exact backup ID

Minimum update sequence:

1. Create pre-update backup.
2. Verify backup manifest and checksums.
3. Apply release update.
4. Run migrations.
5. Run healthcheck.
6. If healthcheck fails, restore previous release and matching backup.

## Policy for External Adapter

The product includes an external adapter as a separate project with its own release lifecycle.

This creates two different responsibilities:

- `deployment recovery scope`: the adapter must be considered during full-site recovery planning
- `implementation scope of this monorepo`: the adapter backup must not be implemented here

Rules:

- this monorepo must not hardcode external adapter backup internals
- the external adapter must provide its own backup and restore mechanism
- full deployment recovery is complete only when both the main product and the adapter are restorable

For installer/supervisor design later:

- integrate adapters through explicit backup/restore contracts
- do not integrate adapters by embedding knowledge of their internal file layout into this monorepo

Operational requirement:

- if Dahua adapter is deployed, its own backup/restore runbook and scripts must exist and be operated alongside the main product backup

## Policy for Durability

Current durability baseline:

- SQLite
- WAL enabled
- foreign keys enabled

This is acceptable for single-node operation, but not sufficient as a recovery story.

Recommended next durability upgrades:

- explicit SQLite backup procedure
- explicit restore rehearsal
- explicit checkpoint policy
- explicit documentation for DB file locations
- explicit ownership of backup success monitoring

## What Can Be Done Now

These tasks do not require installer/supervisor:

- document exact DB/config/license paths per environment
- create backup folder structure
- implement nightly backup scripts for Windows and Linux
- implement pre-update backup scripts for Windows and Linux
- generate `manifest.json` and `checksums.txt`
- document and rehearse restore procedure
- define retention pruning for backup folders
- include device-service DB in all backup scripts
- add optional recent-log attachment support for diagnostics

## What Should Be Deferred Until Installer or Supervisor

These tasks are better done after installer/supervisor exists:

- automatic hourly online SQLite backup
- one-click operator UI for backup and restore
- encrypted off-host copy management
- centralized backup scheduling from one service
- backup health status in control center
- automatic pre-update snapshot as part of installer workflow
- contract-based orchestration across main product and external adapter

## Requirements That Help Installer Design

This backup policy should directly influence installer/supervisor design.

Installer/supervisor should support:

- clear install, config, data, log, license, and backup directories
- one orchestration entry point that can stop all writers safely
- version-aware pre-update snapshots
- restore of both release and state together
- healthcheck after restore
- future adapter backup/restore hooks through explicit contracts
- manifest-driven backup metadata

Recommended directory model:

- install directory for immutable releases
- separate data directory for DBs
- separate config directory for secrets and config
- separate license directory
- separate backup directory
- separate logs directory

This separation will make backup, restore, uninstall, and upgrades much safer.

## Minimum Acceptance Criteria

This policy should be considered implemented only when all of the following are true:

- both SQLite DBs are included in backup scope
- config and license are included in backup scope
- pre-update backup exists and is mandatory
- backup retention is enforced
- restore runbook exists
- at least one restore rehearsal has been completed successfully
- external adapter recovery responsibility has been documented explicitly
