# Troubleshooting

## Port already in use

Symptoms: service cannot start, bind errors in logs.

Actions:
1. Check process on target port.
2. Stop conflicting process.
3. Restart target service.

## Database migration errors (`no such table`)

Symptoms: API/worker errors when querying missing tables.

Actions:
1. Verify `.env` points to expected DB file.
2. Run migrations:
   - `pnpm db:migrate`
   - `pnpm device:db:migrate`
3. Restart services.

## CORS/auth cookie issues

Symptoms: admin-ui cannot authenticate, browser shows CORS/cookie blocked.

Actions:
1. Verify `API_CORS_ALLOWED_ORIGINS`.
2. Verify `API_AUTH_COOKIE_*` settings.
3. Verify admin-ui API base URL and reverse proxy config.
4. Restart API and admin-ui service.

## Internal token mismatch

Symptoms: `401/403` between services (worker -> bot, API -> device-service).

Actions:
1. Compare token values in `.env` for all services.
2. Ensure no stale old release is still running.
3. Restart dependent services in order: API -> device-service -> bot -> worker.

## SQLite locked or permission denied

Symptoms: `SQLITE_BUSY`, write failures, access denied.

Actions:
1. Verify service user has access to DB directory and files.
2. Ensure only one stack instance points to the same DB files.
3. Check disk space and filesystem permissions.
4. Restart the service after conflict is resolved.

## Release rollback

Symptoms: new version unstable after deploy.

Actions:
1. Switch `current` symlink/junction to previous release.
2. Restart all services.
3. Run health checks.
4. Preserve logs for postmortem.
