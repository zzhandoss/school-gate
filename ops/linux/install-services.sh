#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/school-gate/current}"
UNIT_DIR="/etc/systemd/system"

install_unit() {
  local unit_name="$1"
  local source_file="$ROOT_DIR/ops/linux/systemd/${unit_name}"
  local target_file="$UNIT_DIR/${unit_name}"
  sudo cp "$source_file" "$target_file"
}

install_unit "sg-api.service"
install_unit "sg-device-service.service"
install_unit "sg-worker.service"
install_unit "sg-bot.service"

sudo systemctl daemon-reload
sudo systemctl enable sg-api sg-device-service sg-worker sg-bot

echo "Linux services installed and enabled."
