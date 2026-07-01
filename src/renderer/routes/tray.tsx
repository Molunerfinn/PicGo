import { createFileRoute } from "@tanstack/react-router"

import { PicGoTrayPage } from "@/components/independent-window/tray/picgo-tray-page"

export const Route = createFileRoute("/tray")({
  component: PicGoTrayPage,
})
