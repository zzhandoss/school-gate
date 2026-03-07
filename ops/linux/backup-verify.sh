#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/school-gate/current}"
CLI="${ROOT_DIR}/packages/ops/dist/cli.js"
BACKUP_PATH="${1:?backup path is required}"

node "${CLI}" verify --backup-path "${BACKUP_PATH}"
