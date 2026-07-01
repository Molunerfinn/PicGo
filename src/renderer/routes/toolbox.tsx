import { createFileRoute } from "@tanstack/react-router"

import { PicGoToolboxPage } from "@/components/independent-window/toolbox/picgo-toolbox-page"

export const Route = createFileRoute("/toolbox")({
  component: PicGoToolboxPage,
})

