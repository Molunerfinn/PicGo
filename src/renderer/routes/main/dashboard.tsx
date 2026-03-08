import { createFileRoute } from "@tanstack/react-router"

import { PicGoDashboard } from "@/components/main/dashboard/picgo-dashboard"

export const Route = createFileRoute("/main/dashboard")({
  component: PicGoDashboard,
})
