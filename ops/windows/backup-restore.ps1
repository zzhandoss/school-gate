$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path (Split-Path $root -Parent) "backups" }
$cli = Join-Path $root "packages\ops\dist\cli.js"
$stopped = $false

if ($args.Length -lt 1) {
    throw "backup path is required"
}

try {
    & (Join-Path $root "ops\windows\stop-all.ps1")
    $stopped = $true

    node $cli "restore" "--root-dir" $root "--backup-dir" $backupDir "--backup-path" $args[0]

    & (Join-Path $root "ops\windows\start-all.ps1")
    $stopped = $false
    & (Join-Path $root "ops\windows\healthcheck.ps1")
}
finally {
    if ($stopped) {
        & (Join-Path $root "ops\windows\start-all.ps1")
    }
}
