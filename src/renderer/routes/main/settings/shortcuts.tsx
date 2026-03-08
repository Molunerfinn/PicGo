import { createFileRoute } from "@tanstack/react-router"

import { PicGoSettingsShortcuts } from "@/components/main/settings/picgo-settings-shortcuts"

export const Route = createFileRoute("/main/settings/shortcuts")({
  component: PicGoSettingsShortcuts,
})
