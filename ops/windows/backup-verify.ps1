$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$cli = Join-Path $root "packages\ops\dist\cli.js"

if ($args.Length -lt 1) {
    throw "backup path is required"
}

node $cli "verify" "--backup-path" $args[0]
