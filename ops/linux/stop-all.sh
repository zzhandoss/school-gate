#!/usr/bin/env bash
set -euo pipefail

sudo systemctl stop sg-worker sg-bot sg-device-service sg-api
echo "All Linux services stopped."
