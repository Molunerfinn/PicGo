import { createFileRoute } from "@tanstack/react-router"

import { PicGoMainLayout } from "@/components/main/layout/picgo-main-layout"

export const Route = createFileRoute("/main")({
  component: PicGoMainLayout,
})
