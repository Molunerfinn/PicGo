import { createFileRoute } from "@tanstack/react-router"

import { PicGoGallery } from "@/components/main/gallery/picgo-gallery"

export const Route = createFileRoute("/main/gallery")({
  component: () => <PicGoGallery />,
})
