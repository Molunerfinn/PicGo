import { createFileRoute } from "@tanstack/react-router"

import { PicGoSettingsUrlRewrite } from "@/components/main/settings/picgo-settings-url-rewrite"

export const Route = createFileRoute("/main/settings/url-rewrite")({
  component: PicGoSettingsUrlRewrite,
})
