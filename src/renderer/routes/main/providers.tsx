import { createFileRoute } from "@tanstack/react-router"

import { PicGoProviders } from "@/components/main/providers/picgo-providers"

interface ProviderSearchParams {
  uploader?: string
  configId?: string
}

function normalizeSearchString(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const Route = createFileRoute("/main/providers")({
  validateSearch: (search): ProviderSearchParams => ({
    uploader: normalizeSearchString(search.uploader),
    configId: normalizeSearchString(search.configId),
  }),
  component: () => <PicGoProviders />,
})
