import { createFileRoute } from "@tanstack/react-router"

import { PicGoRenamePage } from "@/components/independent-window/rename/picgo-rename-page"

export const Route = createFileRoute("/rename")({
  component: PicGoRenamePage,
})
