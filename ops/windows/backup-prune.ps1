$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path (Split-Path $root -Parent) "backups" }
$cli = Join-Path $root "packages\ops\dist\cli.js"

node $cli "prune" "--root-dir" $root "--backup-dir" $backupDir
