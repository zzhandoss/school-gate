#!/usr/bin/env bash
set -euo pipefail

check_url() {
  local name="$1"
  local url="$2"
  if curl -fsS "$url" > /dev/null; then
    echo "[ok] ${name}: ${url}"
  else
    echo "[fail] ${name}: ${url}"
    return 1
  fi
}

check_url "api" "http://localhost:3000/health"
check_url "device-service" "http://localhost:4010/health"
check_url "bot" "http://localhost:4100/api/health"
check_url "admin-ui" "http://localhost:5000"
