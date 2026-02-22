$ErrorActionPreference = "Stop"

function Test-Http {
    param(
        [string]$Name,
        [string]$Url
    )

    try {
        Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing | Out-Null
        Write-Host "[ok] $Name $Url"
    }
    catch {
        Write-Host "[fail] $Name $Url"
        throw
    }
}

Test-Http -Name "api" -Url "http://localhost:3000/health"
Test-Http -Name "device-service" -Url "http://localhost:4010/health"
Test-Http -Name "bot" -Url "http://localhost:4100/api/health"
Test-Http -Name "admin-ui" -Url "http://localhost:5000"
