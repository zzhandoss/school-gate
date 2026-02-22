# Deploy on Windows 10/11

## Prerequisites

- Node.js 20+
- pnpm 10+
- PowerShell 5.1+
- Service wrapper (NSSM recommended)

## Deploy from prebuilt release zip

1. Download `school-gate-vX.Y.Z-prebuilt.zip` and `SHA256SUMS`.
2. Verify checksum:
   ```powershell
   Get-FileHash .\school-gate-vX.Y.Z-prebuilt.zip -Algorithm SHA256
   ```
   Compare with `SHA256SUMS`.
3. Unpack to `C:\school-gate\releases\vX.Y.Z`.
4. Update symlink/junction `C:\school-gate\current` to the new release.
5. Place production `.env` in `C:\school-gate\current\.env`.
6. Install or update services:
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\school-gate\current\ops\windows\install-services.ps1
   ```
7. Restart services:
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\school-gate\current\ops\windows\restart-all.ps1
   ```
8. Validate:
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\school-gate\current\ops\windows\healthcheck.ps1
   ```

## Rollback

1. Switch `C:\school-gate\current` to previous release.
2. Run `restart-all.ps1`.
3. Run `healthcheck.ps1`.
