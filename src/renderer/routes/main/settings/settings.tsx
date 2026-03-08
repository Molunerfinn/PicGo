import { createFileRoute } from "@tanstack/react-router"

import { PicGoSettings } from "@/components/main/settings/picgo-settings"

interface SettingsSearchParams {
  section?: string
}

function normalizeSearchString(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const Route = createFileRoute("/main/settings/settings")({
  validateSearch: (search): SettingsSearchParams => ({
    section: normalizeSearchString(search.section),
  }),
  component: PicGoSettings,
})
