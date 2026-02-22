import { createFileRoute } from '@tanstack/react-router'

import { DeviceMonitoringView } from '@/components/devices/device-monitoring-view'

export const Route = createFileRoute('/devices/monitoring')({
  component: DeviceMonitoringPage
})

function DeviceMonitoringPage() {
  return <DeviceMonitoringView />
}
