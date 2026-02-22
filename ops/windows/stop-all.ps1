$ErrorActionPreference = "Stop"

$services = @("sg-worker", "sg-bot", "sg-device-service", "sg-api")

foreach ($service in $services) {
    Stop-Service -Name $service -Force
}

Write-Host "All Windows services stopped."
