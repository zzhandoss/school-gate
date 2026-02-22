import { createFileRoute } from '@tanstack/react-router'

import { DeviceAdaptersView } from '@/components/devices/device-adapters-view'

export const Route = createFileRoute('/devices/adapters')({
  component: DeviceAdaptersPage
})

function DeviceAdaptersPage() {
  return <DeviceAdaptersView />
}
