$ErrorActionPreference = "Stop"

$root = if ($env:SG_ROOT) { $env:SG_ROOT } else { "C:\school-gate\current" }
$nssm = if ($env:NSSM_PATH) { $env:NSSM_PATH } else { "nssm" }

function Install-Or-UpdateService {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Arguments
    )

    & $nssm install $Name $Command $Arguments | Out-Null
    & $nssm set $Name AppDirectory $root | Out-Null
    & $nssm set $Name AppStdout "$root\data\logs\$Name.out.log" | Out-Null
    & $nssm set $Name AppStderr "$root\data\logs\$Name.err.log" | Out-Null
    & $nssm set $Name AppExit Default Restart | Out-Null
}

Install-Or-UpdateService -Name "sg-api" -Command "pnpm.cmd" -Arguments "--filter @school-gate/api start"
Install-Or-UpdateService -Name "sg-device-service" -Command "pnpm.cmd" -Arguments "start:device-service"
Install-Or-UpdateService -Name "sg-bot" -Command "pnpm.cmd" -Arguments "--filter @school-gate/bot start"
Install-Or-UpdateService -Name "sg-worker" -Command "pnpm.cmd" -Arguments "start:workers"

Write-Host "Windows services installed/updated."
