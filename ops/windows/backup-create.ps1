$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path (Split-Path $root -Parent) "backups" }
$kind = if ($args.Length -gt 0) { $args[0] } else { "nightly" }
$cli = Join-Path $root "packages\ops\dist\cli.js"
$includeLogs = $env:BACKUP_INCLUDE_LOGS -eq "true"
$stopped = $false

try {
    & (Join-Path $root "ops\windows\stop-all.ps1")
    $stopped = $true

    $cliArgs = @("create", "--kind", $kind, "--root-dir", $root, "--backup-dir", $backupDir)
    if ($includeLogs) {
        $cliArgs += "--include-logs"
    }
    node $cli @cliArgs
    node $cli "prune" "--root-dir" $root "--backup-dir" $backupDir

    & (Join-Path $root "ops\windows\start-all.ps1")
    $stopped = $false
    & (Join-Path $root "ops\windows\healthcheck.ps1")
}
finally {
    if ($stopped) {
        & (Join-Path $root "ops\windows\start-all.ps1")
    }
}
