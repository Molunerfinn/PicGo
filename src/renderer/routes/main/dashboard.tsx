import { createFileRoute } from "@tanstack/react-router"

import { LifecycleBanner } from "@/components/main/cloud/lifecycle-banner"
import { PicGoDashboard } from "@/components/main/dashboard/picgo-dashboard"

export const Route = createFileRoute("/main/dashboard")({
  component: () => (
    <>
      <PicGoDashboard />
      <LifecycleBanner variant="floating" />
    </>
  ),
})
