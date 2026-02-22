#!/usr/bin/env bash
set -euo pipefail

sudo journalctl -u sg-api -u sg-device-service -u sg-bot -u sg-worker -f
