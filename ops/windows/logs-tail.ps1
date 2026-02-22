$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$logs = @(
    "$root\data\logs\sg-api.out.log",
    "$root\data\logs\sg-device-service.out.log",
    "$root\data\logs\sg-bot.out.log",
    "$root\data\logs\sg-worker.out.log"
)

Get-Content -Path $logs -Wait -Tail 50
