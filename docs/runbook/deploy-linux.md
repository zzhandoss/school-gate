# Deploy on Ubuntu 22.04

## Prerequisites

- Node.js 20+
- pnpm 10+
- unzip, tar, systemd
- A dedicated service user, for example `schoolgate`

## Deploy from prebuilt release zip

1. Download `school-gate-vX.Y.Z-prebuilt.zip` and `SHA256SUMS`.
2. Verify checksum:
   ```bash
   sha256sum -c SHA256SUMS
   ```
3. Unpack to target directory, for example `/opt/school-gate/releases/vX.Y.Z`.
4. Create/update symlink:
   ```bash
   ln -sfn /opt/school-gate/releases/vX.Y.Z /opt/school-gate/current
   ```
5. Place production `.env` at `/opt/school-gate/current/.env`.
6. Install/refresh units:
   ```bash
   sudo bash /opt/school-gate/current/ops/linux/install-services.sh
   ```
7. Start or restart:
   ```bash
   sudo bash /opt/school-gate/current/ops/linux/restart-all.sh
   ```
8. Validate:
   ```bash
   bash /opt/school-gate/current/ops/linux/healthcheck.sh
   ```

## Rollback

1. Point `/opt/school-gate/current` to previous release.
2. Run `restart-all.sh`.
3. Run `healthcheck.sh`.
