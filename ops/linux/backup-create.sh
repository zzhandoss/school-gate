#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/school-gate/current}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$ROOT_DIR")/backups}"
BACKUP_KIND="${1:-nightly}"
INCLUDE_LOGS="${INCLUDE_LOGS:-false}"
CLI="${ROOT_DIR}/packages/ops/dist/cli.js"
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

ARGS=("create" "--kind" "${BACKUP_KIND}" "--root-dir" "${ROOT_DIR}" "--backup-dir" "${BACKUP_DIR}")
if [[ "${INCLUDE_LOGS}" == "true" ]]; then
  ARGS+=("--include-logs")
fi

node "${CLI}" "${ARGS[@]}"
node "${CLI}" "prune" "--root-dir" "${ROOT_DIR}" "--backup-dir" "${BACKUP_DIR}"

start_services
STOPPED="false"

bash "${ROOT_DIR}/ops/linux/healthcheck.sh"
