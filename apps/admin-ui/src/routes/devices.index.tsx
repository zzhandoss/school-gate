import { createFileRoute } from '@tanstack/react-router'

import { DevicesView } from '@/components/devices/devices-view'

export const Route = createFileRoute('/devices/')({
  component: DevicesPage
})

function DevicesPage() {
  return <DevicesView />
}
