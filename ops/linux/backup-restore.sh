#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/school-gate/current}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$ROOT_DIR")/backups}"
CLI="${ROOT_DIR}/packages/ops/dist/cli.js"
BACKUP_PATH="${1:?backup path is required}"
STOPPED="false"

start_services() {
  sudo bash "${ROOT_DIR}/ops/linux/start-all.sh"
}

cleanup() {
  if [[ "${STOPPED}" == "true" ]]; then
    start_services
  fi
}

trap cleanup EXIT

sudo bash "${ROOT_DIR}/ops/linux/stop-all.sh"
STOPPED="true"

node "${CLI}" restore --root-dir "${ROOT_DIR}" --backup-dir "${BACKUP_DIR}" --backup-path "${BACKUP_PATH}"

start_services
STOPPED="false"

bash "${ROOT_DIR}/ops/linux/healthcheck.sh"
