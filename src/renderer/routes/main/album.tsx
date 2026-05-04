import { createFileRoute } from "@tanstack/react-router"

import { PicGoAlbum } from "@/components/main/album/picgo-album"

export const Route = createFileRoute("/main/album")({
  component: () => <PicGoAlbum />,
})
