#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/school-gate/current}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$ROOT_DIR")/backups}"
CLI="${ROOT_DIR}/packages/ops/dist/cli.js"

node "${CLI}" prune --root-dir "${ROOT_DIR}" --backup-dir "${BACKUP_DIR}"
