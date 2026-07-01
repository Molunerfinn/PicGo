import { createFileRoute } from "@tanstack/react-router"

import { PicGoMiniPage } from "@/components/independent-window/mini/picgo-mini-page"

export const Route = createFileRoute("/mini")({
  component: PicGoMiniPage,
})
