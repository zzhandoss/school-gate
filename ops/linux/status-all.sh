#!/usr/bin/env bash
set -euo pipefail

sudo systemctl status sg-api --no-pager
sudo systemctl status sg-device-service --no-pager
sudo systemctl status sg-bot --no-pager
sudo systemctl status sg-worker --no-pager
