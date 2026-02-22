#!/usr/bin/env bash
set -euo pipefail

sudo systemctl restart sg-api sg-device-service sg-bot sg-worker
echo "All Linux services restarted."
