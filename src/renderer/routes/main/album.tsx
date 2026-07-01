import { createFileRoute } from "@tanstack/react-router"

import { PicGoAlbum } from "@/components/main/album/picgo-album"
import { LifecycleBanner } from "@/components/main/cloud/lifecycle-banner"

export const Route = createFileRoute("/main/album")({
  component: () => (
    <>
      <PicGoAlbum />
      <LifecycleBanner variant="floating" />
    </>
  ),
})
