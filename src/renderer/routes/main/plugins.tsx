import { createFileRoute } from "@tanstack/react-router"
import { PicGoPlugins } from "@/components/main/plugins/picgo-plugins"

export const Route = createFileRoute("/main/plugins")({
  component: () => <PicGoPlugins />,
})
