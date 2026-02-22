# Operations Runbook

## Service names

- `sg-api`
- `sg-device-service`
- `sg-worker`
- `sg-bot`
- `sg-admin-ui`

## Standard operations (Linux)

- Restart all:
  ```bash
  sudo bash ops/linux/restart-all.sh
  ```
- Status:
  ```bash
  bash ops/linux/status-all.sh
  ```
- Logs:
  ```bash
  bash ops/linux/logs-tail.sh
  ```
- Health:
  ```bash
  bash ops/linux/healthcheck.sh
  ```

## Standard operations (Windows)

- Restart all:
  ```powershell
  powershell -ExecutionPolicy Bypass -File ops\windows\restart-all.ps1
  ```
- Status:
  ```powershell
  powershell -ExecutionPolicy Bypass -File ops\windows\status-all.ps1
  ```
- Health:
  ```powershell
  powershell -ExecutionPolicy Bypass -File ops\windows\healthcheck.ps1
  ```

## Health endpoints

- API: `http://localhost:3000/health`
- Device service: `http://localhost:4010/health`
- Bot API: `http://localhost:4100/api/health`
- Admin UI: `http://localhost:5000`
