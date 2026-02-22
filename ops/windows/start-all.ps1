$ErrorActionPreference = "Stop"

$services = @("sg-api", "sg-device-service", "sg-bot", "sg-worker")

foreach ($service in $services) {
    Start-Service -Name $service
}

Write-Host "All Windows services started."
