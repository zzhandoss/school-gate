$ErrorActionPreference = "Stop"

$services = @("sg-api", "sg-device-service", "sg-bot", "sg-worker")

foreach ($service in $services) {
    Restart-Service -Name $service -Force
}

Write-Host "All Windows services restarted."
