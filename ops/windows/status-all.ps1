$ErrorActionPreference = "Stop"

$services = @("sg-api", "sg-device-service", "sg-bot", "sg-worker")

Get-Service -Name $services | Select-Object Name, Status, StartType
